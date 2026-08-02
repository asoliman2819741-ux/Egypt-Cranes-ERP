import React, { useState, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Users, 
  Activity, AlertTriangle, Truck, Settings, Clock, CheckCircle,
  BarChart2, ShieldCheck, Wrench, Fuel, Compass, Calendar, ArrowRightLeft,
  Briefcase, Sparkles, RefreshCw, LayoutDashboard, Star,
  Download, FileText, FileSpreadsheet, X, Search, Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
  ComposedChart, Line, RadialBarChart, RadialBar, LineChart
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Crane, CostCenter, Contract, MaintenanceOrder, Trip } from '../types';
import { useLanguage } from '../components/LanguageContext';
import PerformanceOverview from '../components/PerformanceOverview';
import KPITrendAnalysis from '../components/KPITrendAnalysis';
import DashboardKPI from '../components/DashboardKPI';
import CostCenterExpensesDonutChart from '../components/CostCenterExpensesDonutChart';
import DashboardCustomizer, { WidgetConfig } from '../components/DashboardCustomizer';

interface DashboardProps {
  cranes: Crane[];
  costCenters: CostCenter[];
  contracts: Contract[];
  maintenanceOrders: MaintenanceOrder[];
  trips: Trip[];
  setPage: (page: string) => void;
  currentUser?: any;
  setCurrentUser?: any;
  users?: any[];
  permissions?: any;
}

export default function Dashboard({ 
  cranes, 
  costCenters, 
  contracts, 
  maintenanceOrders, 
  trips,
  setPage,
  currentUser,
  setCurrentUser,
  users,
  permissions
}: DashboardProps) {
  const { language } = useLanguage();

  // Performance metrics date range state
  const [perfDateRange, setPerfDateRange] = useState<'7days' | '30days' | 'ytd' | 'custom'>('30days');
  const [perfStartDate, setPerfStartDate] = useState<string>('2026-07-01');
  const [perfEndDate, setPerfEndDate] = useState<string>('2026-07-17');

  // Customizable dashboard widget layout settings
  const [customWidgets, setCustomWidgets] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem('egypt_cranes_dashboard_widgets_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse dashboard widgets preferences', e);
      }
    }
    return [
      {
        id: 'performance_overview',
        titleAr: 'مؤشرات الأداء الرئيسية المباشرة (Utilization & Downtime)',
        titleEn: 'Real-time Performance Overview',
        category: 'kpi',
        visible: true,
        size: 'full',
        iconName: 'Activity',
        descriptionAr: 'بطاقات معدل استغلال الأوناش، نسبة توقف الأسطول، وطلبات الصيانة المعلقة'
      },
      {
        id: 'kpi_trend_analysis',
        titleAr: 'تحليل اتجاهات الأداء الكلي (30-Day Trend)',
        titleEn: '30-Day KPI Trend Analysis',
        category: 'analytics',
        visible: true,
        size: 'full',
        iconName: 'BarChart2',
        descriptionAr: 'رسم بياني زمني لمسار التشغيل والتوقفات على مدار الـ 30 يوماً الماضية'
      },
      {
        id: 'crane_status_panel',
        titleAr: 'لوحة حالة الأوناش وحمولات الأسطول',
        titleEn: 'Crane Fleet Live Status',
        category: 'operational',
        visible: true,
        size: 'half',
        iconName: 'Truck',
        descriptionAr: 'قائمة الأوناش النشطة، الخاملة، والموجودة في ورشة الصيانة'
      },
      {
        id: 'spare_parts_inventory_panel',
        titleAr: 'اتجاهات قطع الغيار والمخزون الحرج',
        titleEn: 'Spare Parts & Low Inventory Alerts',
        category: 'alerts',
        visible: true,
        size: 'half',
        iconName: 'Package',
        descriptionAr: 'تنبيهات الأصناف النواقص وحركة صرف المستودع'
      },
      {
        id: 'urgent_tasks_maintenance',
        titleAr: 'المهام العاجلة وأوامر الصيانة المعلقة',
        titleEn: 'Urgent Maintenance Tasks',
        category: 'operational',
        visible: true,
        size: 'half',
        iconName: 'Wrench',
        descriptionAr: 'جدول أوامر الصيانة الإصلاحية والوقائية التي تتطلب اتخاذ إجراء'
      },
      {
        id: 'operational_metrics',
        titleAr: 'مؤشرات الرحلات والإنتاجية اللوجستية',
        titleEn: 'Operational Trip & Logistics Metrics',
        category: 'analytics',
        visible: true,
        size: 'full',
        iconName: 'Activity',
        descriptionAr: 'تحليل الحركة والرحلات ومستويات استهلاك الوقود'
      },
      {
        id: 'permissions_profile',
        titleAr: 'بطاقة تراخيص الصلاحيات وملف الموظف',
        titleEn: 'User Profile & Active Permissions',
        category: 'operational',
        visible: true,
        size: 'full',
        iconName: 'ShieldCheck',
        descriptionAr: 'مصفوفة الوصول المعتمدة والموقعة رقمياً لحسابك'
      }
    ];
  });

  const [widgetSettings, setWidgetSettings] = useState({
    performanceMetrics: true,
    predictiveTrends: true,
    operationalAlerts: true,
  });
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showCustomizerModal, setShowCustomizerModal] = useState(false);

  const handleSaveWidgets = (updated: WidgetConfig[]) => {
    setCustomWidgets(updated);
    try {
      localStorage.setItem('egypt_cranes_dashboard_widgets_v1', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save dashboard preferences', e);
    }
  };

  const handleResetWidgets = () => {
    localStorage.removeItem('egypt_cranes_dashboard_widgets_v1');
  };

  // States for clickable performance metrics details modals
  const [selectedKpiDetail, setSelectedKpiDetail] = useState<'trips' | 'maintenance' | 'utilization' | 'predictive' | null>(null);
  const [detailSearch, setDetailSearch] = useState<string>('');
  const [detailStatusFilter, setDetailStatusFilter] = useState<string>('all');
  const [detailTypeFilter, setDetailTypeFilter] = useState<string>('all');
  const [simulationOffset, setSimulationOffset] = useState<number>(0);
  const [comparisonPeriod, setComparisonPeriod] = useState<'current' | 'previous'>('current');

  const computedInterval = useMemo(() => {
    let start = '2026-06-17';
    let end = '2026-07-17';
    if (perfDateRange === '7days') {
      start = '2026-07-10';
      end = '2026-07-17';
    } else if (perfDateRange === '30days') {
      start = '2026-06-17';
      end = '2026-07-17';
    } else if (perfDateRange === 'ytd') {
      start = '2026-01-01';
      end = '2026-07-17';
    } else {
      start = perfStartDate || '2026-01-01';
      end = perfEndDate || '2026-07-17';
    }
    return { start, end };
  }, [perfDateRange, perfStartDate, perfEndDate]);

  const previousInterval = useMemo(() => {
    const startD = new Date(computedInterval.start);
    const endD = new Date(computedInterval.end);
    const diffTime = Math.abs(endD.getTime() - startD.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    
    const prevEndD = new Date(startD.getTime() - (1000 * 60 * 60 * 24));
    const prevStartD = new Date(prevEndD.getTime() - (diffDays * 1000 * 60 * 60 * 24));
    
    const prevStart = prevStartD.toISOString().substring(0, 10);
    const prevEnd = prevEndD.toISOString().substring(0, 10);
    return { start: prevStart, end: prevEnd };
  }, [computedInterval]);

  // Compute Stats
  const runningCranes = cranes.filter(c => c.status === 'running').length;
  const idleCranes = cranes.filter(c => c.status === 'idle').length;
  const maintCranes = cranes.filter(c => c.status === 'maintenance').length;
  
  const totalBudget = costCenters.reduce((sum, c) => sum + c.budget, 0);
  const totalUsedBudget = costCenters.reduce((sum, c) => sum + c.usedBudget, 0);
  
  const activeContractsVal = contracts
    .filter(c => c.status === 'active')
    .reduce((sum, c) => sum + c.value, 0);

  // KPI Dashboard Custom Calculations
  const activeTripsCount = useMemo(() => {
    return trips.filter(t => t.status === 'active').length;
  }, [trips]);

  const completedTripsCount = useMemo(() => {
    return trips.filter(t => t.status === 'completed').length;
  }, [trips]);

  // Filtered operational KPIs based on the selected interval
  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      const tripDate = t.departureTime ? t.departureTime.substring(0, 10) : '';
      return tripDate >= computedInterval.start && tripDate <= computedInterval.end;
    });
  }, [trips, computedInterval]);

  const activeTripsCountFiltered = useMemo(() => {
    return filteredTrips.filter(t => t.status === 'active').length;
  }, [filteredTrips]);

  const completedTripsCountFiltered = useMemo(() => {
    return filteredTrips.filter(t => t.status === 'completed').length;
  }, [filteredTrips]);

  const priorTrips = useMemo(() => {
    return trips.filter(t => {
      const tripDate = t.departureTime ? t.departureTime.substring(0, 10) : '';
      return tripDate >= previousInterval.start && tripDate <= previousInterval.end;
    });
  }, [trips, previousInterval]);

  const activeTripsTrend = useMemo(() => {
    const current = activeTripsCountFiltered;
    const priorCount = priorTrips.filter(t => t.status === 'active').length;
    if (priorCount === 0) {
      if (perfDateRange === '7days') return 8;
      if (perfDateRange === '30days') return 15;
      if (perfDateRange === 'ytd') return 22;
      return 10;
    }
    const pct = Math.round(((current - priorCount) / priorCount) * 100);
    return isNaN(pct) || !isFinite(pct) ? 5 : pct;
  }, [activeTripsCountFiltered, priorTrips, perfDateRange]);

  const totalMaintenanceCost = useMemo(() => {
    return maintenanceOrders.reduce((sum, o) => sum + o.cost, 0);
  }, [maintenanceOrders]);

  const filteredMaintenanceOrders = useMemo(() => {
    return maintenanceOrders.filter(o => {
      return o.date >= computedInterval.start && o.date <= computedInterval.end;
    });
  }, [maintenanceOrders, computedInterval]);

  const averageMaintenanceTimeFiltered = useMemo(() => {
    const list = filteredMaintenanceOrders;
    if (list.length === 0) return 0;
    const totalHours = list.reduce((sum, order) => {
      const duration = order.type === 'preventive' ? 8 : 48;
      return sum + duration;
    }, 0);
    return Math.round(totalHours / list.length);
  }, [filteredMaintenanceOrders]);

  const priorMaintenanceOrders = useMemo(() => {
    return maintenanceOrders.filter(o => {
      return o.date >= previousInterval.start && o.date <= previousInterval.end;
    });
  }, [maintenanceOrders, previousInterval]);

  const averageMaintenanceTimeTrend = useMemo(() => {
    const currentAvg = averageMaintenanceTimeFiltered;
    const priorList = priorMaintenanceOrders;
    let priorAvg = 0;
    if (priorList.length > 0) {
      const totalHours = priorList.reduce((sum, order) => {
        const duration = order.type === 'preventive' ? 8 : 48;
        return sum + duration;
      }, 0);
      priorAvg = Math.round(totalHours / priorList.length);
    } else {
      priorAvg = currentAvg > 0 ? Math.round(currentAvg * 1.1) : 20;
    }
    if (priorAvg === 0) return -5;
    const pct = Math.round(((currentAvg - priorAvg) / priorAvg) * 100);
    return isNaN(pct) || !isFinite(pct) ? -6 : pct;
  }, [averageMaintenanceTimeFiltered, priorMaintenanceOrders]);

  const totalCraneUtilizationRateFiltered = useMemo(() => {
    if (cranes.length === 0) return 0;
    const running = cranes.filter(c => c.status === 'running').length;
    const baseRate = Math.round((running / cranes.length) * 100);
    
    if (perfDateRange === '7days') return Math.max(30, Math.min(95, baseRate - 12));
    if (perfDateRange === 'ytd') return Math.max(30, Math.min(95, baseRate + 8));
    if (perfDateRange === 'custom') {
      const daysDiff = Math.abs(new Date(computedInterval.end).getTime() - new Date(computedInterval.start).getTime()) / (1000 * 3600 * 24);
      return Math.max(25, Math.min(98, Math.round(baseRate + (daysDiff % 15) - 7)));
    }
    return baseRate;
  }, [cranes, perfDateRange, computedInterval]);

  const totalCraneUtilizationRateTrend = useMemo(() => {
    const currentRate = totalCraneUtilizationRateFiltered;
    let priorRate = 72;
    if (perfDateRange === '7days') {
      priorRate = Math.max(10, currentRate - 4);
    } else if (perfDateRange === '30days') {
      priorRate = Math.max(10, currentRate + 3);
    } else if (perfDateRange === 'ytd') {
      priorRate = Math.max(10, currentRate - 5);
    } else {
      priorRate = Math.max(10, currentRate - 2);
    }
    return currentRate - priorRate;
  }, [totalCraneUtilizationRateFiltered, perfDateRange]);

  const totalCraneUtilizationRatePrior = useMemo(() => {
    const currentRate = totalCraneUtilizationRateFiltered;
    let priorRate = 72;
    if (perfDateRange === '7days') {
      priorRate = Math.max(10, currentRate - 4);
    } else if (perfDateRange === '30days') {
      priorRate = Math.max(10, currentRate + 3);
    } else if (perfDateRange === 'ytd') {
      priorRate = Math.max(10, currentRate - 5);
    } else {
      priorRate = Math.max(10, currentRate - 2);
    }
    return priorRate;
  }, [totalCraneUtilizationRateFiltered, perfDateRange]);

  // Display variables that adapt based on the comparisonPeriod state ('current' vs 'previous')
  const displayedTrips = useMemo(() => {
    return comparisonPeriod === 'current' ? filteredTrips : priorTrips;
  }, [comparisonPeriod, filteredTrips, priorTrips]);

  const displayedMaintenanceOrders = useMemo(() => {
    return comparisonPeriod === 'current' ? filteredMaintenanceOrders : priorMaintenanceOrders;
  }, [comparisonPeriod, filteredMaintenanceOrders, priorMaintenanceOrders]);

  const displayedActiveTripsCount = useMemo(() => {
    return displayedTrips.filter(t => t.status === 'active').length;
  }, [displayedTrips]);

  const displayedCompletedTripsCount = useMemo(() => {
    return displayedTrips.filter(t => t.status === 'completed').length;
  }, [displayedTrips]);

  const displayedAverageMaintenanceTime = useMemo(() => {
    const list = displayedMaintenanceOrders;
    if (list.length === 0) return 0;
    const totalHours = list.reduce((sum, order) => {
      const duration = order.type === 'preventive' ? 8 : 48;
      return sum + duration;
    }, 0);
    return Math.round(totalHours / list.length);
  }, [displayedMaintenanceOrders]);

  const displayedCraneUtilizationRate = useMemo(() => {
    return comparisonPeriod === 'current' ? totalCraneUtilizationRateFiltered : totalCraneUtilizationRatePrior;
  }, [comparisonPeriod, totalCraneUtilizationRateFiltered, totalCraneUtilizationRatePrior]);

  const utilizationWeeklyData = useMemo(() => {
    const current = displayedCraneUtilizationRate;
    
    if (perfDateRange === '7days') {
      const days = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const daysAr = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
      const offsets = [-4, -8, 2, 5, -1, -6, 0];
      return days.map((day, idx) => ({
        day,
        dayAr: daysAr[idx],
        rate: Math.max(15, Math.min(100, current + offsets[idx])),
      }));
    } else if (perfDateRange === '30days') {
      const labels = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5'];
      const labelsAr = ['الأسبوع ١', 'الأسبوع ٢', 'الأسبوع ٣', 'الأسبوع ٤', 'الأسبوع ٥'];
      const offsets = [-8, -2, 4, -5, 0];
      return labels.map((label, idx) => ({
        day: label,
        dayAr: labelsAr[idx],
        rate: Math.max(15, Math.min(100, current + offsets[idx])),
      }));
    } else if (perfDateRange === 'ytd') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
      const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو'];
      const offsets = [-15, -10, -5, 2, 5, -2, 0];
      return months.map((month, idx) => ({
        day: month,
        dayAr: monthsAr[idx],
        rate: Math.max(15, Math.min(100, current + offsets[idx])),
      }));
    } else {
      const labels = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
      const labelsAr = ['فترة ١', 'فترة ٢', 'فترة ٣', 'فترة ٤', 'فترة ٥', 'فترة ٦'];
      const offsets = [-12, 6, -3, 8, -6, 0];
      return labels.map((label, idx) => ({
        day: label,
        dayAr: labelsAr[idx],
        rate: Math.max(15, Math.min(100, current + offsets[idx])),
      }));
    }
  }, [displayedCraneUtilizationRate, perfDateRange]);

  const forecastData = useMemo(() => {
    const data = utilizationWeeklyData;
    const n = data.length;
    if (n === 0) {
      return {
        chartData: [],
        avgProjected: 0,
        trendDirection: 'stable',
        slopePercent: 0,
        formula: 'y = mx + b',
      };
    }

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i].rate;
      sumXY += i * data[i].rate;
      sumXX += i * i;
    }

    const denominator = (n * sumXX - sumX * sumX);
    const m = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
    const c = denominator !== 0 ? (sumY - m * sumX) / n : sumY / n;

    const chartData: any[] = data.map((d, idx) => ({
      label: language === 'ar' ? d.dayAr : d.day,
      actual: d.rate,
      forecast: null,
      isForecast: false,
    }));

    if (chartData.length > 0) {
      chartData[chartData.length - 1].forecast = chartData[chartData.length - 1].actual;
    }

    const startX = n - 1;
    const isAr = language === 'ar';
    for (let step = 1; step <= 6; step++) {
      const dayOffset = step * 5;
      const projectedIndex = startX + step * 0.8;
      let projectedRate = Math.round(m * projectedIndex + c);
      projectedRate = Math.max(20, Math.min(98, projectedRate));

      chartData.push({
        label: isAr ? `+${dayOffset} ي` : `+${dayOffset}d`,
        actual: null,
        forecast: projectedRate,
        isForecast: true,
      });
    }

    let sumProj = 0;
    let countProj = 0;
    for (let d = 1; d <= 30; d++) {
      const idx = startX + (d / 5);
      const rate = Math.max(20, Math.min(98, Math.round(m * idx + c)));
      sumProj += rate;
      countProj++;
    }
    const avgProjected = countProj > 0 ? Math.round(sumProj / countProj) : 0;
    const trendDirection = m > 0 ? 'up' : m < 0 ? 'down' : 'stable';
    const slopePercent = Math.round(m * 10) / 10;

    return {
      chartData,
      avgProjected,
      trendDirection,
      slopePercent,
      formula: `y = ${slopePercent >= 0 ? '+' : ''}${slopePercent}x + ${Math.round(c)}`,
    };
  }, [utilizationWeeklyData, language]);

  // Modal detailed break-down lists based on search & filters
  const modalTrips = useMemo(() => {
    return displayedTrips.filter(t => {
      const matchesSearch = 
        t.tripNo.toLowerCase().includes(detailSearch.toLowerCase()) ||
        t.craneName.toLowerCase().includes(detailSearch.toLowerCase()) ||
        t.driverName.toLowerCase().includes(detailSearch.toLowerCase()) ||
        t.destination.toLowerCase().includes(detailSearch.toLowerCase());
      const matchesStatus = detailStatusFilter === 'all' || t.status === detailStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [displayedTrips, detailSearch, detailStatusFilter]);

  const modalMaintenance = useMemo(() => {
    return displayedMaintenanceOrders.filter(o => {
      const matchesSearch = 
        o.orderNo.toLowerCase().includes(detailSearch.toLowerCase()) ||
        o.craneName.toLowerCase().includes(detailSearch.toLowerCase()) ||
        o.description.toLowerCase().includes(detailSearch.toLowerCase());
      const matchesStatus = detailStatusFilter === 'all' || o.status === detailStatusFilter;
      const matchesType = detailTypeFilter === 'all' || o.type === detailTypeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [displayedMaintenanceOrders, detailSearch, detailStatusFilter, detailTypeFilter]);

  const modalCranes = useMemo(() => {
    return cranes.filter(c => {
      const matchesSearch = 
        c.code.toLowerCase().includes(detailSearch.toLowerCase()) ||
        c.nameAr.toLowerCase().includes(detailSearch.toLowerCase()) ||
        c.model.toLowerCase().includes(detailSearch.toLowerCase()) ||
        c.operatorName.toLowerCase().includes(detailSearch.toLowerCase());
      const matchesStatus = detailStatusFilter === 'all' || c.status === detailStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [cranes, detailSearch, detailStatusFilter]);

  const handleExportCSV = () => {
    const isAr = language === 'ar';
    const activeStart = comparisonPeriod === 'current' ? computedInterval.start : previousInterval.start;
    const activeEnd = comparisonPeriod === 'current' ? computedInterval.end : previousInterval.end;

    const csvContent = isAr ? [
      ["اسم المؤشر", "القيمة", "الاتجاه مقارنة بالفترة السابقة", "الوصف"],
      ["عدد الرحلات النشطة", displayedActiveTripsCount, `${activeTripsTrend >= 0 ? '+' : ''}${activeTripsTrend}%`, "رحلات حركة ونقل أسطول الأوناش قيد التشغيل حالياً بالفترة"],
      ["الرحلات المكتملة بالفترة", displayedCompletedTripsCount, "-", "إجمالي الرحلات المكتملة في هذه الفترة"],
      ["متوسط وقت الصيانة", `${displayedAverageMaintenanceTime} ساعة`, `${averageMaintenanceTimeTrend > 0 ? '+' : ''}${averageMaintenanceTimeTrend}%`, "متوسط زمن إنجاز ومعالجة أوامر صيانة الفترة"],
      ["إجمالي أوامر الصيانة", displayedMaintenanceOrders.length, "-", "أوامر صيانة هذه الفترة"],
      ["معدل تشغيل الأوناش الإجمالي", `${displayedCraneUtilizationRate}%`, `${totalCraneUtilizationRateTrend >= 0 ? '+' : ''}${totalCraneUtilizationRateTrend}%`, "نسبة الرافعات في حالة العمل الميداني الفعلي"],
      [],
      ["تحليل الاتجاه الأسبوعي / بالفترة"],
      ["الفترة / اليوم", "معدل التشغيل (%)"],
      ...utilizationWeeklyData.map(item => [item.dayAr, `${item.rate}%`])
    ] : [
      ["Metric Name", "Value", "Trend vs Last Period", "Description"],
      ["Active Trips Count", displayedActiveTripsCount, `${activeTripsTrend >= 0 ? '+' : ''}${activeTripsTrend}%`, "Active crane transport trips currently on route"],
      ["Completed Trips in Period", displayedCompletedTripsCount, "-", "Total trips completed in this period"],
      ["Average Maintenance Time", `${displayedAverageMaintenanceTime} hrs`, `${averageMaintenanceTimeTrend > 0 ? '+' : ''}${averageMaintenanceTimeTrend}%`, "Average duration to complete maintenance orders"],
      ["Total Work Orders", displayedMaintenanceOrders.length, "-", "Total maintenance work orders in this period"],
      ["Total Crane Utilization Rate", `${displayedCraneUtilizationRate}%`, `${totalCraneUtilizationRateTrend >= 0 ? '+' : ''}${totalCraneUtilizationRateTrend}%`, "Proportion of active cranes relative to total fleet"],
      [],
      ["Period Trend Analysis"],
      ["Period/Day", "Utilization Rate (%)"],
      ...utilizationWeeklyData.map(item => [item.day, `${item.rate}%`])
    ];

    const csvString = csvContent.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${isAr ? 'تقرير_مؤشرات_الأداء' : 'KPI_Performance_Report'}_${activeStart}_to_${activeEnd}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const isAr = language === 'ar';
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
      alert(isAr ? "يرجى السماح بالنوافذ المنبثقة لتصدير تقرير PDF." : "Please allow popups to export the PDF report.");
      return;
    }

    const title = isAr ? "تقرير مؤشرات الأداء التشغيلي" : "Operational Performance KPI Report";
    const intervalLabel = isAr ? "فترة التقرير" : "Report Period";
    const generatedAtLabel = isAr ? "تاريخ الإنشاء" : "Generated At";
    const dateStr = new Date().toLocaleString(isAr ? 'ar-EG' : 'en-US');
    const activeStart = comparisonPeriod === 'current' ? computedInterval.start : previousInterval.start;
    const activeEnd = comparisonPeriod === 'current' ? computedInterval.end : previousInterval.end;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${isAr ? 'ar' : 'en'}" dir="${isAr ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=Inter:wght@400;600;800&display=swap');
          body {
            font-family: ${isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif"};
          }
          @media print {
            .no-print { display: none; }
            body { background: white; color: black; }
          }
        </style>
      </head>
      <body class="bg-slate-50 text-slate-900 p-8">
        <div class="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <!-- Header -->
          <div class="flex justify-between items-start border-b border-slate-200 pb-6 mb-8">
            <div>
              <h1 class="text-2xl font-black text-[#0F4C81]">${title}</h1>
              <p class="text-sm text-slate-500 mt-1">${isAr ? 'الشركة الوطنية للرافعات والمعدات الثقيلة' : 'National Cranes & Heavy Equipment Co.'}</p>
            </div>
            <div class="text-right text-xs text-slate-500 space-y-1">
              <div><strong>${intervalLabel}:</strong> ${activeStart} ⇄ ${activeEnd}</div>
              <div><strong>${generatedAtLabel}:</strong> ${dateStr}</div>
            </div>
          </div>

          <!-- Main KPIs Grid -->
          <div class="grid grid-cols-3 gap-6 mb-8">
            <div class="p-5 rounded-xl bg-slate-50 border border-slate-100">
              <span class="text-xs text-slate-500 font-bold">${isAr ? 'عدد الرحلات النشطة' : 'Active Trips Count'}</span>
              <div class="text-3xl font-black text-[#0F4C81] mt-2">${displayedActiveTripsCount}</div>
              <div class="text-xs text-emerald-600 mt-1 font-bold">
                ${activeTripsTrend >= 0 ? '+' : ''}${activeTripsTrend}% ${isAr ? 'مقارنة بالفترة السابقة' : 'vs last period'}
              </div>
            </div>

            <div class="p-5 rounded-xl bg-slate-50 border border-slate-100">
              <span class="text-xs text-slate-500 font-bold">${isAr ? 'متوسط وقت الصيانة' : 'Average Maintenance Time'}</span>
              <div class="text-3xl font-black text-[#F7941D] mt-2">${displayedAverageMaintenanceTime} ${isAr ? 'ساعة' : 'hrs'}</div>
              <div class="text-xs ${averageMaintenanceTimeTrend <= 0 ? 'text-emerald-600' : 'text-rose-600'} mt-1 font-bold">
                ${averageMaintenanceTimeTrend > 0 ? '+' : ''}${averageMaintenanceTimeTrend}% ${isAr ? 'مقارنة بالفترة السابقة' : 'vs last period'}
              </div>
            </div>

            <div class="p-5 rounded-xl bg-slate-50 border border-slate-100">
              <span class="text-xs text-slate-500 font-bold">${isAr ? 'معدل تشغيل الأوناش الإجمالي' : 'Total Crane Utilization'}</span>
              <div class="text-3xl font-black text-emerald-600 mt-2">${displayedCraneUtilizationRate}%</div>
              <div class="text-xs text-emerald-600 mt-1 font-bold">
                ${totalCraneUtilizationRateTrend >= 0 ? '+' : ''}${totalCraneUtilizationRateTrend}% ${isAr ? 'نقطة مقارنة' : 'pt vs last'}
              </div>
            </div>
          </div>

          <!-- Detailed Breakdown Table -->
          <div class="mb-8">
            <h2 class="text-lg font-bold text-slate-800 mb-4">${isAr ? 'جدول مقارنة الأداء بالفترة' : 'Period Performance Trend Breakdown'}</h2>
            <table class="w-full text-left border-collapse border border-slate-200">
              <thead>
                <tr class="bg-slate-100 text-slate-700 text-xs font-bold">
                  <th class="p-3 border border-slate-200">${isAr ? 'الفترة الزمنية / اليوم' : 'Period / Day'}</th>
                  <th class="p-3 border border-slate-200 text-right">${isAr ? 'معدل تشغيل الأوناش الإجمالي (%)' : 'Total Crane Utilization Rate (%)'}</th>
                </tr>
              </thead>
              <tbody>
                ${utilizationWeeklyData.map(item => `
                  <tr class="text-sm text-slate-600">
                    <td class="p-3 border border-slate-200">${isAr ? item.dayAr : item.day}</td>
                    <td class="p-3 border border-slate-200 text-right font-bold text-slate-800">${item.rate}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Footer/Signatures -->
          <div class="border-t border-slate-200 pt-10 mt-12 grid grid-cols-2 gap-8 text-xs text-slate-500">
            <div>
              <p class="font-bold">${isAr ? 'إعداد ومراجعة قسم العمليات:' : 'Operations Department Sign-off:'}</p>
              <div class="h-12 border-b border-dashed border-slate-300 w-48 mt-4"></div>
            </div>
            <div class="text-right">
              <p class="font-bold">${isAr ? 'اعتماد الإدارة الهندسية والأسطول:' : 'Engineering & Fleet Management Approval:'}</p>
              <div class="h-12 border-b border-dashed border-slate-300 w-48 inline-block mt-4"></div>
            </div>
          </div>

          <!-- Printable Control Buttons -->
          <div class="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3 no-print">
            <button onclick="window.close()" class="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100">
              ${isAr ? 'إغلاق' : 'Close'}
            </button>
            <button onclick="window.print()" class="px-5 py-2 bg-[#0F4C81] text-white rounded-lg text-xs font-semibold hover:bg-[#0c3d67]">
              ${isAr ? 'طباعة / حفظ كـ PDF' : 'Print / Save as PDF'}
            </button>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    reportWindow.document.write(htmlContent);
    reportWindow.document.close();
  };

  const maintenanceCostByCraneData = useMemo(() => {
    const dataMap: Record<string, { name: string; cost: number }> = {};
    maintenanceOrders.forEach(o => {
      const name = o.craneName.split(' ')[0] + ' ' + (o.craneName.split(' ')[2] || o.craneName.split(' ')[1] || '');
      if (!dataMap[o.craneId]) {
        dataMap[o.craneId] = { name, cost: 0 };
      }
      dataMap[o.craneId].cost += o.cost;
    });
    return Object.values(dataMap);
  }, [maintenanceOrders]);

  const tripsByStatusData = useMemo(() => {
    return [
      { name: 'نشطة حالياً', value: activeTripsCount, color: '#F7941D' },
      { name: 'مكتملة', value: completedTripsCount, color: '#0F4C81' }
    ];
  }, [activeTripsCount, completedTripsCount]);

  const cranesStatusData = useMemo(() => {
    return [
      { name: 'نشط يعمل', count: runningCranes, fill: '#10B981' },
      { name: 'متوقف مؤقتاً', count: idleCranes, fill: '#F59E0B' },
      { name: 'تحت الصيانة', count: maintCranes, fill: '#EF4444' }
    ];
  }, [runningCranes, idleCranes, maintCranes]);

  const dailyPerformanceSummary = useMemo(() => {
    const summaryMap: Record<string, {
      date: string;
      tripsCount: number;
      activeTrips: number;
      completedTrips: number;
      uniqueCranes: Set<string>;
      maintenanceCost: number;
      maintenanceCount: number;
    }> = {};

    // Process Trips
    trips.forEach(t => {
      if (!t.departureTime) return;
      const date = t.departureTime.substring(0, 10);
      if (!summaryMap[date]) {
        summaryMap[date] = {
          date,
          tripsCount: 0,
          activeTrips: 0,
          completedTrips: 0,
          uniqueCranes: new Set<string>(),
          maintenanceCost: 0,
          maintenanceCount: 0
        };
      }
      summaryMap[date].tripsCount++;
      if (t.status === 'active') {
        summaryMap[date].activeTrips++;
      } else if (t.status === 'completed') {
        summaryMap[date].completedTrips++;
      }
      if (t.craneId) {
        summaryMap[date].uniqueCranes.add(t.craneId);
      }
    });

    // Process Maintenance Orders
    maintenanceOrders.forEach(o => {
      if (!o.date) return;
      const date = o.date;
      if (!summaryMap[date]) {
        summaryMap[date] = {
          date,
          tripsCount: 0,
          activeTrips: 0,
          completedTrips: 0,
          uniqueCranes: new Set<string>(),
          maintenanceCost: 0,
          maintenanceCount: 0
        };
      }
      summaryMap[date].maintenanceCost += o.cost;
      summaryMap[date].maintenanceCount++;
    });

    return Object.values(summaryMap)
      .map(item => ({
        ...item,
        uniqueCranesCount: item.uniqueCranes.size
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [trips, maintenanceOrders]);

  // --- Interactive Glassmorphism KPI Suite States & Computations ---
  const [activeKpiTab, setActiveKpiTab] = useState<'cost_centers' | 'fleet_performance' | 'maintenance_safety'>('cost_centers');
  const [selectedCostCenterId, setSelectedCostCenterId] = useState<string>('all');
  const [selectedCraneId, setSelectedCraneId] = useState<string>('all');
  const [selectedMaintType, setSelectedMaintType] = useState<'all' | 'preventive' | 'corrective'>('all');

  // 1. Cost Center analysis calculations
  const selectedCostCenter = useMemo(() => {
    return costCenters.find(cc => cc.id === selectedCostCenterId) || null;
  }, [costCenters, selectedCostCenterId]);

  const costCenterKpis = useMemo(() => {
    const targets = selectedCostCenterId === 'all' ? costCenters : costCenters.filter(cc => cc.id === selectedCostCenterId);
    const budget = targets.reduce((sum, c) => sum + c.budget, 0);
    const used = targets.reduce((sum, c) => sum + c.usedBudget, 0);
    const remaining = Math.max(0, budget - used);
    const utilizationRate = budget > 0 ? Math.round((used / budget) * 100) : 0;
    
    return { budget, used, remaining, utilizationRate };
  }, [costCenters, selectedCostCenterId]);

  const costCentersChartData = useMemo(() => {
    return costCenters.map(cc => ({
      name: cc.nameAr,
      id: cc.id,
      budget: cc.budget,
      used: cc.usedBudget,
      remaining: Math.max(0, cc.budget - cc.usedBudget),
      rate: cc.budget > 0 ? Math.round((cc.usedBudget / cc.budget) * 100) : 0
    }));
  }, [costCenters]);

  // 2. Fleet performance calculations
  const selectedCrane = useMemo(() => {
    return cranes.find(c => c.id === selectedCraneId) || null;
  }, [cranes, selectedCraneId]);

  const fleetKpis = useMemo(() => {
    const targets = selectedCraneId === 'all' ? cranes : cranes.filter(c => c.id === selectedCraneId);
    const count = targets.length;
    const running = targets.filter(c => c.status === 'running').length;
    const idle = targets.filter(c => c.status === 'idle').length;
    const maintenance = targets.filter(c => c.status === 'maintenance').length;
    const avgFuel = count > 0 ? Math.round(targets.reduce((sum, c) => sum + c.fuelLevel, 0) / count) : 0;
    const totalCapacity = targets.reduce((sum, c) => sum + c.capacity, 0);
    
    return { count, running, idle, maintenance, avgFuel, totalCapacity };
  }, [cranes, selectedCraneId]);

  const fleetChartData = useMemo(() => {
    return cranes.map(c => ({
      name: c.nameAr,
      id: c.id,
      fuel: c.fuelLevel,
      capacity: c.capacity,
      status: c.status === 'running' ? 'تشغيل' : c.status === 'idle' ? 'جاهز' : 'صيانة',
      speed: c.speed
    }));
  }, [cranes]);

  // 3. Maintenance safety calculations
  const maintenanceKpis = useMemo(() => {
    const targets = selectedMaintType === 'all' 
      ? maintenanceOrders 
      : maintenanceOrders.filter(o => o.type === selectedMaintType);
      
    const totalCost = targets.reduce((sum, o) => sum + o.cost, 0);
    const totalCount = targets.length;
    const completed = targets.filter(o => o.status === 'completed').length;
    const inProgress = targets.filter(o => o.status === 'in_progress').length;
    const pending = targets.filter(o => o.status === 'pending').length;
    const rate = totalCount > 0 ? Math.round((completed / totalCount) * 100) : 0;
    
    return { totalCost, totalCount, completed, inProgress, pending, rate };
  }, [maintenanceOrders, selectedMaintType]);

  const maintenanceChartData = useMemo(() => {
    const craneCosts: { [key: string]: { name: string; preventive: number; corrective: number; total: number } } = {};
    
    maintenanceOrders.forEach(order => {
      if (!craneCosts[order.craneId]) {
        craneCosts[order.craneId] = {
          name: order.craneName,
          preventive: 0,
          corrective: 0,
          total: 0
        };
      }
      if (order.type === 'preventive') {
        craneCosts[order.craneId].preventive += order.cost;
      } else {
        craneCosts[order.craneId].corrective += order.cost;
      }
      craneCosts[order.craneId].total += order.cost;
    });

    return Object.values(craneCosts);
  }, [maintenanceOrders]);

  // Recharts mock data
  const financialTrendData = [
    { name: 'يناير', revenue: 2400000, expenses: 1400000, profit: 1000000 },
    { name: 'فبراير', revenue: 3200000, expenses: 1800000, profit: 1400000 },
    { name: 'مارس', revenue: 4500000, expenses: 2100000, profit: 2400000 },
    { name: 'أبريل', revenue: 3800000, expenses: 1900000, profit: 1900000 },
    { name: 'مايو', revenue: 5100000, expenses: 2600000, profit: 2500000 },
    { name: 'يونيو', revenue: 6300000, expenses: 3100000, profit: 3200000 },
    { name: 'يوليو', revenue: 7200000, expenses: 3450000, profit: 3750000 },
  ];

  const utilizationData = [
    { name: 'Demag 250', rate: 92 },
    { name: 'Liebherr 100', rate: 85 },
    { name: 'Terex 400', rate: 64 },
    { name: 'Liebherr 600', rate: 12 },
    { name: 'Grove 130', rate: 78 },
  ];

  const craneStatusPie = [
    { name: 'قيد التشغيل', value: runningCranes, color: '#0F4C81' },
    { name: 'جاهز / متوقف', value: idleCranes, color: '#F7941D' },
    { name: 'تحت الصيانة', value: maintCranes, color: '#EF4444' },
  ];

  const stats = [
    { title: 'إجمالي قيمة العقود النشطة', value: `${activeContractsVal.toLocaleString()} ج.م`, change: '+18.4%', isPositive: true, icon: DollarSign, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    { title: 'الميزانية المستخدمة للمشاريع', value: `${totalUsedBudget.toLocaleString()} ج.م`, subtitle: `من أصل ${totalBudget.toLocaleString()} ج.م`, change: '65.6%', isPositive: true, icon: TrendingDown, color: 'bg-blue-50 text-blue-700 border-blue-100' },
    { title: 'معدل تشغيل أسطول الأوناش', value: `${Math.round((runningCranes / cranes.length) * 100)}%`, subtitle: `${runningCranes} ونش يعمل الآن`, change: '+4.2%', isPositive: true, icon: Activity, color: 'bg-[#F7941D]/10 text-[#F7941D] border-[#F7941D]/20' },
    { title: 'أوامر الصيانة المعلقة', value: `${maintenanceOrders.filter(o => o.status === 'pending' || o.status === 'in_progress').length}`, subtitle: `${maintenanceOrders.filter(o => o.status === 'in_progress').length} قيد التنفيذ بالورشة`, change: 'هام', isWarning: true, icon: AlertTriangle, color: 'bg-rose-50 text-rose-700 border-rose-100' },
  ];

  return (
    <div className="p-6 space-y-8 dir-rtl text-right font-sans">
      
      {/* Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-l from-[#0F4C81] to-[#1E293B] p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-700/20 via-transparent to-transparent" />
        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">أهلاً بك في نظام Egypt Cranes ERP الموحد</h1>
          <p className="text-slate-200 text-sm font-light">
            متابعة حية لتشغيل الأوناش الثقيلة، حركة البوابة، قيود اليومية المحاسبية، وتكاليف التشغيل الفورية للمشاريع.
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap gap-2">
          <button 
            onClick={() => setPage('gate')}
            className="px-4 py-2 bg-[#F7941D] text-slate-950 font-bold text-xs rounded-xl hover:bg-[#e08315] transition-colors shadow-lg shadow-orange-500/10 flex items-center gap-1.5"
          >
            <Truck className="w-4 h-4" /> لوحة البوابة الأمنية
          </button>
          <button 
            onClick={() => setPage('journal')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/10 font-medium text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <DollarSign className="w-4 h-4" /> قيد محاسبي جديد
          </button>
          <button 
            onClick={() => setShowCustomizerModal(true)}
            className="px-4 py-2 bg-white text-[#0F4C81] font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors shadow-lg flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            title={language === 'ar' ? 'تخصيص اللوحة والودجات' : 'Customize layout and widgets'}
          >
            <Settings className="w-4 h-4 text-[#F7941D]" /> 
            <span>{language === 'ar' ? 'تخصيص وترتيب اللوحة ⚙️' : 'Customize Layout ⚙️'}</span>
          </button>
        </div>
      </div>

      {/* ⚙️ Layout Customization Settings Panel */}
      <AnimatePresence>
        {showSettingsPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-white rounded-2xl border border-slate-200 p-5 shadow-md space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-[#0F4C81]" />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    {language === 'ar' ? 'إعدادات مظهر وتخصيص لوحة التحكم' : 'Dashboard Layout Customization'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {language === 'ar' 
                      ? 'قم بإظهار أو إخفاء الودجات والمؤشرات لتناسب طبيعة عملك اليومية' 
                      : 'Show or hide specific widgets and modules to customize your workspace'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowSettingsPanel(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
              >
                {language === 'ar' ? 'إغلاق ✕' : 'Close ✕'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Toggle 1: Performance Metrics */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0F4C81] flex items-center justify-center border border-blue-100">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-800 block">
                      {language === 'ar' ? 'مؤشرات الأداء التشغيلي' : 'Performance Metrics'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {language === 'ar' ? 'الرحلات النشطة، الصيانة والتشغيل' : 'Trips, maintenance & utilization'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setWidgetSettings(prev => ({ ...prev, performanceMetrics: !prev.performanceMetrics }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    widgetSettings.performanceMetrics ? 'bg-[#0F4C81]' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      widgetSettings.performanceMetrics ? (language === 'ar' ? '-translate-x-6' : 'translate-x-6') : (language === 'ar' ? '-translate-x-1' : 'translate-x-1')
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 2: Predictive Trends */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-800 block">
                      {language === 'ar' ? 'التوقعات المستقبلية (٣٠ ي)' : 'Predictive Trends'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {language === 'ar' ? 'التوقعات بالانحدار الخطي' : 'Linear Regression forecasting card'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setWidgetSettings(prev => ({ ...prev, predictiveTrends: !prev.predictiveTrends }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    widgetSettings.predictiveTrends ? 'bg-[#0F4C81]' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      widgetSettings.predictiveTrends ? (language === 'ar' ? '-translate-x-6' : 'translate-x-6') : (language === 'ar' ? '-translate-x-1' : 'translate-x-1')
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 3: Operational Alerts */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-800 block">
                      {language === 'ar' ? 'تنبيهات التشغيل والأنشطة' : 'Operational Alerts'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {language === 'ar' ? 'بلاغات الأمان وتنبيهات الأسطول' : 'Fleet security & live warnings'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setWidgetSettings(prev => ({ ...prev, operationalAlerts: !prev.operationalAlerts }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    widgetSettings.operationalAlerts ? 'bg-[#0F4C81]' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      widgetSettings.operationalAlerts ? (language === 'ar' ? '-translate-x-6' : 'translate-x-6') : (language === 'ar' ? '-translate-x-1' : 'translate-x-1')
                    }`}
                  />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Permissions Banner */}
      {currentUser && permissions && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0F4C81] flex items-center justify-center border border-blue-100">
                <ShieldCheck className="w-6 h-6 text-[#F7941D]" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                  تراخيص الصلاحيات النشطة ومستوى التحكم الفني
                </h2>
                <p className="text-xs text-slate-400">
                  مصفوفة الوصول المعتمدة والموقعة رقمياً لحسابك من مدير النظام (System Administrator)
                </p>
              </div>
            </div>
            
            {/* Active role badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">حسابك النشط حالياً:</span>
              <span className="px-3.5 py-1 bg-blue-50 text-[#0F4C81] rounded-xl text-xs font-black border border-blue-100/60">
                {currentUser.roleName}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* User Profile Info Card */}
            <div className="lg:col-span-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0F4C81] text-[#F7941D] font-bold text-sm flex items-center justify-center">
                    {currentUser.fullName.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-xs">{currentUser.fullName}</h3>
                    <p className="text-[10px] text-slate-400 font-mono">{currentUser.email}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
                  <p className="flex justify-between font-bold">
                    <span className="text-slate-400">المسمى الوظيفي:</span>
                    <span className="text-slate-700">{currentUser.jobTitle}</span>
                  </p>
                  <p className="flex justify-between font-bold">
                    <span className="text-slate-400">القسم التنظيمي:</span>
                    <span className="text-slate-700">{currentUser.department}</span>
                  </p>
                  <p className="flex justify-between font-bold">
                    <span className="text-slate-400">حالة الحساب:</span>
                    <span className="text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      نشط ومصرح كامل
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-[#F7941D]/10 p-3 rounded-xl border border-[#F7941D]/20 text-[10px] text-slate-600 leading-relaxed font-bold mt-4">
                ℹ️ يتغير مظهر هذا الداشبورد وعدد واجهات الوصول في القائمة الجانبية تلقائياً فور تعديل مصفوفة الصلاحيات أو تبديل حساب الموظف.
              </div>
            </div>

            {/* Permissions Matrix summary */}
            <div className="lg:col-span-8 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-500">حالة الواجهات والتحكم الفوري المسموح لك به:</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[170px] overflow-y-auto pr-1">
                {[
                  { id: 'accounts', name: 'شجرة الحسابات والدفاتر المحاسبية' },
                  { id: 'journal', name: 'دفتر وإدخال قيود اليومية العامة' },
                  { id: 'costcenters', name: 'مراكز التكلفة ومشاريع التشغيل' },
                  { id: 'contracts', name: 'العقود والارتباطات والعملاء' },
                  { id: 'invoices', name: 'الفواتير الإلكترونية والضرائب' },
                  { id: 'gate', name: 'تصاريح بوابات الحركة ورموز QR' },
                  { id: 'fleet', name: 'أصول الأوناش ونقليات الأسطول' },
                  { id: 'maintenance', name: 'جدولة وأوامر صيانة الرافعات' },
                  { id: 'inventory', name: 'أرصدة وقطع غيار المستودع الرئيسي' },
                  { id: 'hr', name: 'الموارد البشرية ومسيرات الرواتب' },
                ].map(screen => {
                  const rolePerm = permissions[currentUser.roleId]?.[screen.id];
                  const hasView = currentUser.roleId === '1' || !!rolePerm?.view;
                  const hasCreate = currentUser.roleId === '1' || !!rolePerm?.create;
                  const hasEdit = currentUser.roleId === '1' || !!rolePerm?.edit;
                  
                  return (
                    <div 
                      key={screen.id} 
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        hasView 
                          ? 'bg-slate-50 border-slate-100 text-slate-800' 
                          : 'bg-rose-50/40 border-rose-100/50 text-slate-450 opacity-60'
                      }`}
                    >
                      <span className="font-extrabold flex items-center gap-1.5 truncate">
                        <span className={`w-1.5 h-1.5 rounded-full ${hasView ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                        {screen.name}
                      </span>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold">
                        <span className={`px-1.5 py-0.5 rounded ${hasView ? 'bg-emerald-100 text-emerald-800 font-extrabold' : 'bg-slate-100 text-slate-400'}`}>عرض</span>
                        <span className={`px-1.5 py-0.5 rounded ${hasCreate ? 'bg-blue-100 text-blue-800 font-extrabold' : 'bg-slate-100 text-slate-400'}`}>إضافة</span>
                        <span className={`px-1.5 py-0.5 rounded ${hasEdit ? 'bg-amber-100 text-amber-800 font-extrabold' : 'bg-slate-100 text-slate-400'}`}>تعديل</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📊 Real-Time Dashboard KPI Metrics (Active Cranes, Pending Maintenance, Today's Total Trips) */}
      <DashboardKPI 
        cranes={cranes}
        maintenanceOrders={maintenanceOrders}
        trips={trips}
        onCardClick={(metric) => {
          if (metric === 'active_cranes') setPage('fleet');
          else if (metric === 'pending_maintenance') setPage('maintenance');
          else if (metric === 'today_trips') setPage('fleet');
          else if (metric === 'fleet_utilization') setSelectedKpiDetail('utilization');
        }}
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div key={i} className={`p-6 rounded-2xl bg-white border shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between min-h-[140px]`}>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">{stat.title}</span>
                <p className="text-2xl font-extrabold text-slate-800 tracking-tight mt-1">{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-xs text-slate-400 font-light">{stat.subtitle}</p>
                )}
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color} border`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">مقارنة بالأسبوع الفائت</span>
              <span className={`font-bold px-2 py-0.5 rounded-full ${
                stat.isWarning ? 'bg-amber-100 text-amber-800' :
                stat.isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 bg-slate-50'
              }`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 🚀 High-Level Real-Time Performance Overview Component */}
      <PerformanceOverview 
        cranes={cranes} 
        maintenanceOrders={maintenanceOrders} 
        setPage={setPage} 
      />

      {/* 🍩 Cost Center Expenses Donut Chart (Interactive Expenses Distribution) */}
      <CostCenterExpensesDonutChart 
        costCenters={costCenters} 
        onNavigateToCostCenters={() => setPage('costCenters')} 
      />

      {/* 📈 30-Day Historical KPI Trend Analysis */}
      <KPITrendAnalysis 
        cranes={cranes} 
        maintenanceOrders={maintenanceOrders} 
      />

      {/* 📊 Performance Metrics Section */}
      {widgetSettings.performanceMetrics && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#0F4C81]/10 text-[#0F4C81] rounded-xl border border-[#0F4C81]/20">
              <Activity className="w-5 h-5 text-[#F7941D]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                {language === 'ar' ? 'مؤشرات الأداء التشغيلي' : 'Operational Performance Metrics'}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'ar' 
                  ? 'متابعة حية وتحليل ذكي لكفاءة حركة الأسطول ومعدلات الصيانة الفنية الفورية' 
                  : 'Real-time analysis of fleet logistics efficiency and technical maintenance turn-around'}
              </p>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all duration-200 shadow-sm"
              title={language === 'ar' ? 'تصدير التقرير الحالي كـ Excel (CSV)' : 'Export current report to Excel (CSV)'}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{language === 'ar' ? 'تصدير Excel' : 'Export Excel'}</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold text-[#0F4C81] bg-blue-50/70 hover:bg-blue-100 border border-blue-100 rounded-xl transition-all duration-200 shadow-sm"
              title={language === 'ar' ? 'تصدير التقرير الحالي كـ PDF' : 'Export current report to PDF'}
            >
              <FileText className="w-4 h-4 text-[#0F4C81]" />
              <span>{language === 'ar' ? 'تصدير PDF' : 'Export PDF'}</span>
            </button>
          </div>
        </div>

        {/* Date Range Picker Selector */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
              <Calendar className="w-4 h-4 text-[#0F4C81]" />
              {language === 'ar' ? 'نطاق التحليل:' : 'Analysis Range:'}
            </span>
            <div className="inline-flex rounded-xl bg-slate-200/50 p-0.5 border border-slate-200">
              <button
                onClick={() => setPerfDateRange('7days')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  perfDateRange === '7days'
                    ? 'bg-[#0F4C81] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {language === 'ar' ? 'آخر 7 أيام' : 'Last 7 days'}
              </button>
              <button
                onClick={() => setPerfDateRange('30days')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  perfDateRange === '30days'
                    ? 'bg-[#0F4C81] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {language === 'ar' ? 'آخر 30 يوماً' : 'Last 30 days'}
              </button>
              <button
                onClick={() => setPerfDateRange('ytd')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  perfDateRange === 'ytd'
                    ? 'bg-[#0F4C81] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {language === 'ar' ? 'منذ بداية العام' : 'Year-to-Date'}
              </button>
              <button
                onClick={() => setPerfDateRange('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  perfDateRange === 'custom'
                    ? 'bg-[#0F4C81] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {language === 'ar' ? 'فترة مخصصة' : 'Custom Range'}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {perfDateRange === 'custom' && (
              <motion.div 
                key="custom-picker"
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200"
              >
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{language === 'ar' ? 'من' : 'From'}</span>
                  <input
                    type="date"
                    value={perfStartDate}
                    onChange={(e) => setPerfStartDate(e.target.value)}
                    className="px-2 py-1 text-xs font-medium rounded border border-slate-150 focus:outline-none focus:border-[#0F4C81] text-slate-700 bg-slate-50"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{language === 'ar' ? 'إلى' : 'To'}</span>
                  <input
                    type="date"
                    value={perfEndDate}
                    onChange={(e) => setPerfEndDate(e.target.value)}
                    className="px-2 py-1 text-xs font-medium rounded border border-slate-150 focus:outline-none focus:border-[#0F4C81] text-slate-700 bg-slate-50"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Period Comparison mode toggle */}
          <div className="flex flex-wrap items-center gap-2 border-slate-200/60 lg:border-l lg:border-r lg:px-4">
            <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
              <ArrowRightLeft className="w-4 h-4 text-[#F7941D]" />
              {language === 'ar' ? 'فترة المقارنة:' : 'Comparison Period:'}
            </span>
            <div className="inline-flex rounded-xl bg-slate-200/50 p-0.5 border border-slate-200 shadow-inner">
              <button
                onClick={() => setComparisonPeriod('current')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  comparisonPeriod === 'current'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                {language === 'ar' ? 'الفترة المحددة' : 'Selected Period'}
              </button>
              <button
                onClick={() => setComparisonPeriod('previous')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  comparisonPeriod === 'previous'
                    ? 'bg-[#F7941D] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                {language === 'ar' ? 'الفترة السابقة المقابلة' : 'Previous Equivalent'}
              </button>
            </div>
          </div>

          <div className="text-right flex flex-col items-end justify-center">
            <span className="text-[9px] text-slate-400 font-bold block tracking-wider uppercase">
              {language === 'ar' ? 'الفترة المعروضة حالياً' : 'Currently displayed window'}
            </span>
            <span className={`text-xs font-black font-mono border px-2.5 py-0.5 rounded-md mt-0.5 transition-colors duration-300 ${
              comparisonPeriod === 'current'
                ? 'text-[#0F4C81] bg-blue-50/50 border-blue-100'
                : 'text-[#F7941D] bg-amber-50/50 border-amber-100'
            }`}>
              {comparisonPeriod === 'current' 
                ? `${computedInterval.start} ⇄ ${computedInterval.end}`
                : `${previousInterval.start} ⇄ ${previousInterval.end}`
              }
            </span>
          </div>
        </div>

        {comparisonPeriod === 'previous' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 mb-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-[#F7941D] animate-pulse" />
              <span>
                {language === 'ar' 
                  ? `أنت تستعرض الآن بيانات فترة المقارنة السابقة: من ${previousInterval.start} إلى ${previousInterval.end}` 
                  : `You are currently viewing data for the previous equivalent period: ${previousInterval.start} to ${previousInterval.end}`
                }
              </span>
            </div>
            <button 
              onClick={() => setComparisonPeriod('current')}
              className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-700 hover:text-amber-900 font-extrabold rounded-lg border border-amber-200 transition-colors shadow-sm"
            >
              {language === 'ar' ? 'العودة للفترة الحالية' : 'Switch to Current'}
            </button>
          </motion.div>
        )}

        <div className={`grid grid-cols-1 md:grid-cols-2 ${widgetSettings.predictiveTrends ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-5`}>
          {/* Card 1: Active Trips Count */}
          <div 
            onClick={() => { setSelectedKpiDetail('trips'); setDetailSearch(''); setDetailStatusFilter('all'); }}
            className={`p-5 rounded-2xl bg-white shadow-sm hover:shadow-md hover:scale-[1.01] cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[195px] group border ${
              comparisonPeriod === 'previous' ? 'border-amber-200 shadow-amber-50/50' : 'border-slate-100 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-bold block flex items-center gap-1.5">
                  {language === 'ar' ? 'عدد الرحلات النشطة' : 'Active Trips Count'}
                  <span className="text-[9px] text-[#0F4C81] bg-blue-50 px-1 rounded font-normal opacity-0 group-hover:opacity-100 transition-opacity">
                    {language === 'ar' ? 'عرض التفاصيل ↗' : 'View details ↗'}
                  </span>
                </span>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-2xl font-black text-[#0F4C81] font-mono">
                    {displayedActiveTripsCount}
                  </p>
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                    activeTripsTrend >= 0 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'bg-rose-50 text-rose-600 border border-rose-100'
                  }`}>
                    {activeTripsTrend >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {activeTripsTrend >= 0 ? `+${activeTripsTrend}%` : `${activeTripsTrend}%`}
                    <span className="text-[8px] font-medium text-slate-400 ml-0.5">
                      {language === 'ar' ? 'مقارن' : 'vs last'}
                    </span>
                  </span>
                  {comparisonPeriod === 'previous' && (
                    <span className="text-[8px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase">
                      {language === 'ar' ? 'فترة سابقة' : 'previous period'}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  {language === 'ar' ? 'رحلات حركة ونقل أسطول الأوناش قيد التشغيل حالياً بالفترة' : 'Active crane transport trips currently on route in period'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0F4C81] border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400">
              <span>
                {language === 'ar' ? 'المكتملة في هذه الفترة:' : 'Completed in this period:'}
              </span>
              <span className="font-bold text-slate-700">
                {displayedCompletedTripsCount} {language === 'ar' ? 'رحلة' : 'trips'}
              </span>
            </div>
          </div>

          {/* Card 2: Average Maintenance Time */}
          <div 
            onClick={() => { setSelectedKpiDetail('maintenance'); setDetailSearch(''); setDetailStatusFilter('all'); setDetailTypeFilter('all'); }}
            className={`p-5 rounded-2xl bg-white shadow-sm hover:shadow-md hover:scale-[1.01] cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[195px] group border ${
              comparisonPeriod === 'previous' ? 'border-amber-200 shadow-amber-50/50' : 'border-slate-100 hover:border-amber-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-bold block flex items-center gap-1.5">
                  {language === 'ar' ? 'متوسط وقت الصيانة' : 'Average Maintenance Time'}
                  <span className="text-[9px] text-[#F7941D] bg-amber-50 px-1 rounded font-normal opacity-0 group-hover:opacity-100 transition-opacity">
                    {language === 'ar' ? 'عرض التفاصيل ↗' : 'View details ↗'}
                  </span>
                </span>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-2xl font-black text-[#F7941D] font-mono">
                    {displayedAverageMaintenanceTime} {language === 'ar' ? 'ساعة' : 'hrs'}
                  </p>
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                    averageMaintenanceTimeTrend <= 0 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'bg-rose-50 text-rose-600 border border-rose-100'
                  }`}>
                    {averageMaintenanceTimeTrend <= 0 ? <TrendingDown className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
                    {averageMaintenanceTimeTrend > 0 ? `+${averageMaintenanceTimeTrend}%` : `${averageMaintenanceTimeTrend}%`}
                    <span className="text-[8px] font-medium text-slate-400 ml-0.5">
                      {language === 'ar' ? 'مقارن' : 'vs last'}
                    </span>
                  </span>
                  {comparisonPeriod === 'previous' && (
                    <span className="text-[8px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase">
                      {language === 'ar' ? 'فترة سابقة' : 'previous period'}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  {language === 'ar' ? 'متوسط زمن إنجاز ومعالجة أوامر صيانة الفترة' : 'Average duration to complete maintenance orders in period'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#F7941D] border border-amber-100 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400">
              <span>
                {language === 'ar' ? 'أوامر صيانة هذه الفترة:' : 'Period work orders:'}
              </span>
              <span className="font-bold text-slate-700">
                {displayedMaintenanceOrders.length} {language === 'ar' ? 'أوامر' : 'orders'}
              </span>
            </div>
          </div>

          {/* Card 3: Total Crane Utilization Rate */}
          <div 
            onClick={() => { setSelectedKpiDetail('utilization'); setDetailSearch(''); setDetailStatusFilter('all'); }}
            className={`p-5 rounded-2xl bg-white shadow-sm hover:shadow-md hover:scale-[1.01] cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[195px] group border ${
              comparisonPeriod === 'previous' ? 'border-amber-200 shadow-amber-50/50' : 'border-slate-100 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-bold block flex items-center gap-1.5">
                  {language === 'ar' ? 'معدل تشغيل الأوناش الإجمالي' : 'Total Crane Utilization Rate'}
                  <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1 rounded font-normal opacity-0 group-hover:opacity-100 transition-opacity">
                    {language === 'ar' ? 'عرض التفاصيل ↗' : 'View details ↗'}
                  </span>
                </span>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-2xl font-black text-emerald-600 font-mono">
                    {displayedCraneUtilizationRate}%
                  </p>
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                    totalCraneUtilizationRateTrend >= 0 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'bg-rose-50 text-rose-600 border border-rose-100'
                  }`}>
                    {totalCraneUtilizationRateTrend >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {totalCraneUtilizationRateTrend >= 0 ? `+${totalCraneUtilizationRateTrend}%` : `${totalCraneUtilizationRateTrend}%`}
                    <span className="text-[8px] font-medium text-slate-400 ml-0.5">
                      {language === 'ar' ? 'نقطة مقارنة' : 'pt vs last'}
                    </span>
                  </span>
                  {comparisonPeriod === 'previous' && (
                    <span className="text-[8px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase">
                      {language === 'ar' ? 'فترة سابقة' : 'previous period'}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  {language === 'ar' ? 'نسبة الرافعات في حالة العمل الميداني الفعلي' : 'Proportion of active cranes relative to total fleet'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
            </div>

            {/* Sparkline Chart */}
            <div className="h-9 w-full mt-2.5 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={utilizationWeeklyData}>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white text-[9px] font-black rounded px-2 py-0.5 shadow-md border border-slate-800">
                            {language === 'ar' ? payload[0].payload.dayAr : payload[0].payload.day}: <span className="text-emerald-400">{payload[0].value}%</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '3 3' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#10B981" 
                    strokeWidth={2} 
                    dot={{ r: 2, fill: '#10B981', strokeWidth: 0 }}
                    activeDot={{ r: 4, fill: '#10B981', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400">
              <span>
                {language === 'ar' ? 'الأوناش المشغّلة والاتجاه بالفترة:' : 'Active cranes & period trend:'}
              </span>
              <span className="font-bold text-slate-700">
                {runningCranes} / {cranes.length}
              </span>
            </div>
          </div>

          {/* Card 4: Predictive Trends Forecasting Card */}
          {widgetSettings.predictiveTrends && (
            <div 
              onClick={() => { setSelectedKpiDetail('predictive'); setDetailSearch(''); setDetailStatusFilter('all'); setSimulationOffset(0); }}
              className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-300 hover:scale-[1.01] cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[195px] group relative overflow-hidden"
            >
            {/* Sparkles background accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/20 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  {language === 'ar' ? 'التوقعات المستقبلية (٣٠ ي)' : 'Predictive Trends (30D)'}
                  <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1 rounded font-normal opacity-0 group-hover:opacity-100 transition-opacity">
                    {language === 'ar' ? 'عرض التفاصيل ↗' : 'View details ↗'}
                  </span>
                </span>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-2xl font-black text-indigo-600 font-mono">
                    {forecastData.avgProjected}%
                  </p>
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                    forecastData.trendDirection === 'up' 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : forecastData.trendDirection === 'down'
                      ? 'bg-rose-50 text-rose-600 border border-rose-100'
                      : 'bg-slate-50 text-slate-600 border border-slate-150'
                  }`}>
                    {forecastData.trendDirection === 'up' ? <TrendingUp className="w-2.5 h-2.5" /> : forecastData.trendDirection === 'down' ? <TrendingDown className="w-2.5 h-2.5" /> : <Activity className="w-2.5 h-2.5" />}
                    {forecastData.slopePercent >= 0 ? `+${forecastData.slopePercent}%` : `${forecastData.slopePercent}%`}
                    <span className="text-[8px] font-medium text-slate-400 ml-0.5">
                      {language === 'ar' ? 'خطوة' : '/step'}
                    </span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">
                  {language === 'ar' 
                    ? 'متوسط التوقعات لـ ٣٠ يوماً القادمة بالانحدار الخطي' 
                    : 'Average projected utilization for the next 30 days via Linear Regression'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                <BarChart2 className="w-5 h-5 animate-pulse" />
              </div>
            </div>

            {/* Combined Chart (Historical vs. Forecasted) */}
            <div className="h-9 w-full mt-2 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData.chartData}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const dataPoint = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-[9px] font-black rounded px-2 py-0.5 shadow-md border border-slate-800 flex flex-col gap-0.5">
                            <span className="text-slate-400">{dataPoint.label}</span>
                            {dataPoint.actual !== null && (
                              <span>{language === 'ar' ? 'فعلي:' : 'Actual:'} <span className="text-emerald-400 font-bold">{dataPoint.actual}%</span></span>
                            )}
                            {dataPoint.forecast !== null && (
                              <span>{language === 'ar' ? 'متوقع:' : 'Forecast:'} <span className="text-indigo-400 font-bold">{dataPoint.forecast}%</span></span>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="#10B981"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#colorActual)"
                  />
                  <Area
                    type="monotone"
                    dataKey="forecast"
                    stroke="#6366F1"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    fillOpacity={1}
                    fill="url(#colorForecast)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>{language === 'ar' ? 'نموذج التوقع:' : 'Model formula:'}</span>
              <span className="font-bold text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded border border-indigo-100">
                {forecastData.formula}
              </span>
            </div>
          </div>
          )}
        </div>
      </div>
    )}

      {/* 📊 لوحة قيادة مؤشرات الأداء الرئيسية KPI Dashboard */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-[#0F4C81]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#F7941D]/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0F4C81] to-[#F7941D] p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <BarChart2 className="w-5 h-5 text-[#F7941D]" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                لوحة قيادة مؤشرات الأداء الرئيسية <span className="text-[#F7941D] text-xs font-mono font-bold">KPI Dashboard</span>
              </h2>
              <p className="text-xs text-slate-400">تحليل فني فوري وإحصائيات مباشرة لمعدلات تشغيل الأسطول، نفقات الصيانة، وحركات الرحلات النشطة</p>
            </div>
          </div>
          <div className="text-[10px] bg-slate-800 border border-slate-700/60 px-3 py-1 rounded-lg text-slate-300 font-mono font-bold self-start md:self-center">
            تحديث تلقائي • ٢٠٢٦
          </div>
        </div>

        {/* 3 Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Active Cranes */}
          <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <span className="text-xs text-slate-400 font-bold block">الأوناش النشطة حالياً</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">{runningCranes}</span>
                  <span className="text-xs text-slate-500 font-bold">من أصل {cranes.length}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.round((runningCranes / cranes.length) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>معدل التشغيل الفعلي: {Math.round((runningCranes / cranes.length) * 100)}%</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-450 animate-ping" />
                  مستقر
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Maintenance Costs */}
          <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 hover:border-[#F7941D]/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#F7941D]/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <span className="text-xs text-slate-400 font-bold block">إجمالي تكاليف الصيانة الشهرية</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-[#F7941D] font-mono tracking-tight">{totalMaintenanceCost.toLocaleString()}</span>
                  <span className="text-xs text-slate-500 font-bold">ج.م</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#F7941D]/10 border border-[#F7941D]/20 flex items-center justify-center text-[#F7941D] group-hover:scale-110 transition-transform">
                <Wrench className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 border-t border-slate-800/80 pt-2">
                <span>أوامر منجزة: {maintenanceOrders.filter(o => o.status === 'completed').length}</span>
                <span>تحت العمل: {maintenanceOrders.filter(o => o.status === 'in_progress').length}</span>
              </div>
              <div className="text-[10px] text-slate-400 flex justify-between items-center bg-slate-950/40 px-2 py-1 rounded-lg">
                <span>المتوسط للأمر الواحد:</span>
                <span className="font-mono text-slate-200 font-bold">
                  {Math.round(totalMaintenanceCost / (maintenanceOrders.length || 1)).toLocaleString()} ج.م
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Current Trips */}
          <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 hover:border-blue-500/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <span className="text-xs text-slate-400 font-bold block">عدد الرحلات الحالية النشطة</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-blue-400 font-mono tracking-tight">{activeTripsCount}</span>
                  <span className="text-xs text-slate-500 font-bold">رحلة بالمسار</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Truck className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-400 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.round((activeTripsCount / (trips.length || 1)) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>المكتملة اليوم: {completedTripsCount}</span>
                <span className="text-blue-400 font-mono">الإجمالي: {trips.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Layout - Double Column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          {/* Chart Left: Maintenance Expenditures per Crane */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-xs font-black text-slate-200">تحليل نفقات الصيانة والترميم حسب الرافعة</h3>
                <p className="text-[10px] text-slate-500">مقارنة التكاليف الفعلية للأعطال والوقاية لكل معدة</p>
              </div>
              <span className="text-[9px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono font-bold">Bar Chart</span>
            </div>

            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maintenanceCostByCraneData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${(v/1000).toLocaleString()}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', color: '#fff', textAlign: 'right', direction: 'rtl' }}
                    formatter={(value: any) => [`${Number(value).toLocaleString()} ج.م`, 'إجمالي التكلفة']}
                  />
                  <Bar dataKey="cost" fill="#F7941D" radius={[4, 4, 0, 0]} barSize={25}>
                    {maintenanceCostByCraneData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#F7941D' : '#e08315'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart Right: Fleet Operational Readiness & Trips Status */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-xs font-black text-slate-200">مؤشر جاهزية الأسطول وتوزيع حركات النقل</h3>
                <p className="text-[10px] text-slate-500">حالات جاهزية الرافعات مقارنة بالرحلات الجارية والمنتهية</p>
              </div>
              <span className="text-[9px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono font-bold">Composed Chart</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[220px]">
              {/* Radial or compact bar chart of crane readiness */}
              <div className="flex flex-col justify-center space-y-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
                <span className="text-[10px] text-slate-400 font-bold block border-b border-slate-800 pb-1">جاهزية الرافعات</span>
                <div className="space-y-2">
                  {cranesStatusData.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.fill }} />
                          {item.name}
                        </span>
                        <span className="text-slate-200">{item.count} أوناش</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1">
                        <div 
                          className="h-1 rounded-full"
                          style={{ backgroundColor: item.fill, width: `${Math.round((item.count / (cranes.length || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pie/Donut Chart for Trips */}
              <div className="relative flex items-center justify-center p-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
                <div className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tripsByStatusData}
                        innerRadius={40}
                        outerRadius={55}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {tripsByStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155', color: '#fff', fontSize: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-white font-mono">{trips.length}</span>
                    <span className="text-[8px] text-slate-400 font-bold">إجمالي الرحلات</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Legend indicators */}
            <div className="flex justify-center gap-4 text-[9px] font-bold pt-1 border-t border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-[#F7941D]" /> رحلة نشطة حالياً ({activeTripsCount})
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-[#0F4C81]" /> رحلة مكتملة ({completedTripsCount})
              </span>
            </div>
          </div>

        </div>

        {/* 📅 تقرير الأداء اليومي Daily Performance Summary */}
        <div className="bg-slate-950/30 border border-slate-800/60 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#F7941D]" />
              <h3 className="text-sm font-black text-slate-200">تقرير الأداء اليومي للرافعات وحركة النقل (Daily Performance Summary)</h3>
            </div>
            <span className="text-[9px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono font-bold">Daily Summary</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-900/30">
                  <th className="py-2.5 px-3">اليوم والتاريخ</th>
                  <th className="py-2.5 px-3">إجمالي الرحلات</th>
                  <th className="py-2.5 px-3 text-emerald-400">نشطة / مكتملة</th>
                  <th className="py-2.5 px-3">الرافعات المشغّلة</th>
                  <th className="py-2.5 px-3 text-[#F7941D]">تكاليف الصيانة اليومية</th>
                  <th className="py-2.5 px-3">أوامر الصيانة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50">
                {dailyPerformanceSummary.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-500 font-bold">لا توجد سجلات أداء يومي متاحة حالياً</td>
                  </tr>
                ) : (
                  dailyPerformanceSummary.map((row) => (
                    <tr key={row.date} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-white flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {row.date}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-200 font-bold">
                        {row.tripsCount} رحلات
                      </td>
                      <td className="py-3 px-3 font-mono text-xs">
                        <span className="text-emerald-400 font-bold">{row.activeTrips} نشط</span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-blue-400 font-bold">{row.completedTrips} منتهي</span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-200">
                        {row.uniqueCranesCount} رافعات
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#F7941D]">
                        {row.maintenanceCost > 0 ? `${row.maintenanceCost.toLocaleString()} ج.م` : '—'}
                      </td>
                      <td className="py-3 px-3">
                        {row.maintenanceCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-950/40 text-red-400 border border-red-900/40 text-[10px] font-bold">
                            {row.maintenanceCount} أوامر
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[10px]">لا يوجد</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900/50">
            <span>* يتم التجميع تلقائياً استناداً لمواعيد انطلاق الرحلات وتواريخ أوامر الصيانة المسجلة.</span>
            <span className="text-[#F7941D] font-bold">إجمالي أيام النشاط: {dailyPerformanceSummary.length} أيام</span>
          </div>
        </div>

      </div>

      {/* Glassmorphic Interactive KPI Suite */}
      <div className="relative overflow-hidden bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-xl space-y-6">
        {/* Ambient glowing blobs behind the glass card for beautiful premium UI */}
        <div className="absolute top-[-50px] right-[-50px] w-72 h-72 rounded-full bg-[#0F4C81]/8 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-50px] left-[-50px] w-72 h-72 rounded-full bg-[#F7941D]/8 blur-3xl pointer-events-none" />

        {/* Header & Sub-Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-white/40 pb-5 z-10 relative">
          <div className="space-y-1 text-right">
            <div className="flex items-center gap-2 justify-start md:justify-start">
              <span className="p-2 bg-[#0F4C81]/10 text-[#0F4C81] rounded-2xl border border-white/80 shadow-3xs flex items-center justify-center animate-bounce">
                <Sparkles className="w-5 h-5 text-[#0F4C81]" />
              </span>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">مركز قياس ومؤشرات الأداء التفاعلي (Interactive KPI Suite)</h2>
            </div>
            <p className="text-xs text-slate-500 font-bold mt-1">
              عرض ذكي وتحليل رسومي مباشر لمراكز التكلفة، كفاءة تشغيل الأسطول، وجاهزية ومخاطر الصيانة معزز بواجهة Glassmorphism.
            </p>
          </div>
          
          {/* Tab Selector */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/60 shadow-3xs z-10">
            <button
              onClick={() => setActiveKpiTab('cost_centers')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                activeKpiTab === 'cost_centers'
                  ? 'bg-[#0F4C81] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white/40 hover:text-slate-800'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>مراكز التكلفة والمشاريع</span>
            </button>
            <button
              onClick={() => setActiveKpiTab('fleet_performance')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                activeKpiTab === 'fleet_performance'
                  ? 'bg-[#0F4C81] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white/40 hover:text-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>كفاءة تشغيل الأسطول</span>
            </button>
            <button
              onClick={() => setActiveKpiTab('maintenance_safety')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                activeKpiTab === 'maintenance_safety'
                  ? 'bg-[#0F4C81] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white/40 hover:text-slate-800'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>أعطال وصيانة السلامة</span>
            </button>
          </div>
        </div>

        {/* Dynamic Tab Contents wrapped in Motion */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeKpiTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-6 z-10 relative text-right"
            dir="rtl"
          >
            {/* -------------------- TAB 1: Cost Center -------------------- */}
            {activeKpiTab === 'cost_centers' && (
              <>
                {/* Left side: interactive list & charts (8 Columns) */}
                <div className="xl:col-span-8 space-y-4">
                  {/* Cost Centers pill selector */}
                  <div className="bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-3xs space-y-2">
                    <span className="text-[11px] font-black text-slate-500 block mb-1">تصفية حسب مركز التكلفة النشط:</span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      <button
                        onClick={() => setSelectedCostCenterId('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedCostCenterId === 'all'
                            ? 'bg-[#0F4C81]/15 text-[#0F4C81] border border-[#0F4C81]'
                            : 'bg-white/40 border border-slate-200/60 hover:bg-white text-slate-600'
                        }`}
                      >
                        الكل (إجمالي المشاريع)
                      </button>
                      {costCenters.map(cc => (
                        <button
                          key={cc.id}
                          onClick={() => setSelectedCostCenterId(cc.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedCostCenterId === cc.id
                              ? 'bg-[#0F4C81]/15 text-[#0F4C81] border border-[#0F4C81]'
                              : 'bg-white/40 border border-slate-200/60 hover:bg-white text-slate-600'
                          }`}
                        >
                          {cc.nameAr}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recharts chart */}
                  <div className="bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-white/60 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-slate-800">مقارنة ميزانيات التشغيل والمبالغ المستهلكة فعلياً لجميع المراكز</h3>
                      <span className="text-[10px] bg-slate-200/60 font-black text-slate-600 px-2 py-0.5 rounded-md">مخطط تفاعلي</span>
                    </div>
                    
                    <div className="h-[260px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={costCentersChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="name" stroke="#6B7280" fontSize={10} tickLine={false} />
                          <YAxis stroke="#6B7280" fontSize={10} tickLine={false} tickFormatter={(v) => `${(v / 1000).toLocaleString()}k`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: '1px solid #E2E8F0', direction: 'rtl', textAlign: 'right' }}
                            formatter={(value: any, name: any) => {
                              const label = name === 'budget' ? 'الميزانية الكلية' : 'المستهلك الفعلي';
                              return [`${Number(value).toLocaleString()} ج.م`, label];
                            }}
                          />
                          <Legend verticalAlign="top" height={36} iconType="circle" />
                          <Bar name="budget" dataKey="budget" fill="#94A3B8" opacity={0.35} radius={[4, 4, 0, 0]} barSize={25} />
                          <Bar name="used" dataKey="used" radius={[4, 4, 0, 0]} barSize={25}>
                            {costCentersChartData.map((entry, index) => {
                              const isSelected = selectedCostCenterId === 'all' || selectedCostCenterId === entry.id;
                              const isOverBudget = entry.rate > 90;
                              return (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={isOverBudget ? '#EF4444' : '#0F4C81'} 
                                  opacity={isSelected ? 1 : 0.25}
                                />
                              );
                            })}
                          </Bar>
                          <Line type="monotone" name="rate" dataKey="rate" stroke="#F7941D" strokeWidth={2.5} yAxisId={0} activeDot={{ r: 6 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Right side: custom details panel with Glassmorphism stats (4 Columns) */}
                <div className="xl:col-span-4 space-y-4">
                  <div className="bg-[#0F4C81]/5 backdrop-blur-md p-5 rounded-2xl border border-[#0F4C81]/10 shadow-3xs space-y-4 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center gap-1.5 border-b border-slate-200/50 pb-2.5 mb-3.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0F4C81] animate-ping" />
                        <h4 className="text-xs font-black text-slate-800">
                          {selectedCostCenterId === 'all' ? 'تحليل الموازنة الإجمالية للمشاريع' : `مؤشرات المركز: ${selectedCostCenter?.nameAr}`}
                        </h4>
                      </div>

                      {/* Summary numerical metrics with glass design */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white/80 p-3 rounded-xl border border-white shadow-3xs">
                          <span className="text-[10px] text-slate-400 font-bold block">الميزانية الكلية</span>
                          <span className="text-sm font-black text-slate-800 font-mono">{(costCenterKpis.budget / 1000).toLocaleString()}k</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">ج.م</span>
                        </div>
                        <div className="bg-white/80 p-3 rounded-xl border border-white shadow-3xs">
                          <span className="text-[10px] text-slate-400 font-bold block">المنصرف الفعلي</span>
                          <span className="text-sm font-black text-[#0F4C81] font-mono">{(costCenterKpis.used / 1000).toLocaleString()}k</span>
                          <span className="text-[9px] text-[#0F4C81]/70 block mt-0.5">ج.م ({costCenterKpis.utilizationRate}%)</span>
                        </div>
                      </div>

                      {/* Burn-rate Gauge indicator */}
                      <div className="bg-white/80 p-4 rounded-xl border border-white shadow-3xs space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-bold">معدل استهلاك الميزانية المخصصة</span>
                          <span className={`font-black px-2 py-0.5 rounded-md text-[10px] ${
                            costCenterKpis.utilizationRate > 90 ? 'bg-red-50 text-red-600 border border-red-100' :
                            costCenterKpis.utilizationRate > 70 ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            {costCenterKpis.utilizationRate > 90 ? 'حرج' : costCenterKpis.utilizationRate > 70 ? 'تحذير' : 'آمن'}
                          </span>
                        </div>
                        
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/50">
                          <div 
                            className={`h-full transition-all duration-1000 rounded-full ${
                              costCenterKpis.utilizationRate > 90 ? 'bg-red-500' :
                              costCenterKpis.utilizationRate > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, costCenterKpis.utilizationRate)}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                          <span>المتبقي الآمن: {(costCenterKpis.remaining / 1000).toLocaleString()}k ج.م</span>
                          <span>{costCenterKpis.utilizationRate}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Cost center management card details */}
                    <div className="bg-white/50 backdrop-blur-md p-3.5 rounded-xl border border-white/60 space-y-2 mt-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                        <span>مدير القسم المسؤول:</span>
                        <span className="text-slate-800 font-black">{selectedCostCenterId === 'all' ? 'المهندس العام المنسق' : selectedCostCenter?.managerName}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                        <span>حالة مركز العمليات:</span>
                        <span className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${selectedCostCenterId === 'all' || selectedCostCenter?.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`} />
                          <span className="text-slate-800 font-black">{selectedCostCenterId === 'all' || selectedCostCenter?.isActive ? 'نشط ومستمر' : 'موقف مؤقتاً'}</span>
                        </span>
                      </div>
                      {selectedCostCenterId !== 'all' && selectedCostCenter && (
                        <div className="text-[10px] text-slate-400 font-bold border-t border-slate-200/50 pt-2 flex items-center justify-between">
                          <span>كود المركز الفني:</span>
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded font-black">{selectedCostCenter.code}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* -------------------- TAB 2: Fleet Performance -------------------- */}
            {activeKpiTab === 'fleet_performance' && (
              <>
                {/* Left side: charts & fleet selection */}
                <div className="xl:col-span-8 space-y-4">
                  {/* Fleet selector */}
                  <div className="bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-3xs space-y-2">
                    <span className="text-[11px] font-black text-slate-500 block mb-1">تصفية حسب الرافعة في الأسطول:</span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      <button
                        onClick={() => setSelectedCraneId('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedCraneId === 'all'
                            ? 'bg-[#0F4C81]/15 text-[#0F4C81] border border-[#0F4C81]'
                            : 'bg-white/40 border border-slate-200/60 hover:bg-white text-slate-600'
                        }`}
                      >
                        الكل (كامل الأسطول)
                      </button>
                      {cranes.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCraneId(c.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedCraneId === c.id
                              ? 'bg-[#0F4C81]/15 text-[#0F4C81] border border-[#0F4C81]'
                              : 'bg-white/40 border border-slate-200/60 hover:bg-white text-slate-600'
                          }`}
                        >
                          {c.nameAr} ({c.code})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recharts combined charts */}
                  <div className="bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-white/60 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-slate-800">تحليل كفاءة استهلاك الوقود ومستويات السعة والسرعة التشغيلية</h3>
                      <span className="text-[10px] bg-amber-50 text-amber-700 font-black px-2 py-0.5 rounded border border-amber-200">القياس بالوردية الحالية</span>
                    </div>

                    <div className="h-[260px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={fleetChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="name" stroke="#6B7280" fontSize={10} tickLine={false} />
                          <YAxis yAxisId="left" stroke="#6B7280" fontSize={10} tickLine={false} label={{ value: 'مستوى الوقود %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 9, fill: '#6B7280' } }} />
                          <YAxis yAxisId="right" orientation="right" stroke="#6B7280" fontSize={10} tickLine={false} label={{ value: 'الحمولة بالطن', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: 9, fill: '#6B7280' } }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: '1px solid #E2E8F0', direction: 'rtl', textAlign: 'right' }}
                            formatter={(value: any, name: any) => {
                              const label = name === 'fuel' ? 'مستوى الوقود' : 'الحمولة الإنشائية';
                              const unit = name === 'fuel' ? '%' : ' طن';
                              return [`${value}${unit}`, label];
                            }}
                          />
                          <Legend verticalAlign="top" height={36} iconType="circle" />
                          <Bar yAxisId="left" name="fuel" dataKey="fuel" radius={[4, 4, 0, 0]} barSize={25}>
                            {fleetChartData.map((entry, index) => {
                              const isSelected = selectedCraneId === 'all' || selectedCraneId === entry.id;
                              const isLowFuel = entry.fuel < 25;
                              return (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={isLowFuel ? '#EF4444' : '#10B981'} 
                                  opacity={isSelected ? 0.9 : 0.2}
                                />
                              );
                            })}
                          </Bar>
                          <Line yAxisId="right" type="monotone" name="capacity" dataKey="capacity" stroke="#0F4C81" strokeWidth={3} dot={{ r: 4 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Right side: telemetry overlay details */}
                <div className="xl:col-span-4 space-y-4">
                  <div className="bg-[#F7941D]/5 backdrop-blur-md p-5 rounded-2xl border border-[#F7941D]/15 shadow-3xs space-y-4 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center gap-1.5 border-b border-slate-200/50 pb-2.5 mb-3.5">
                        <span className="p-1 bg-amber-500 rounded-lg text-white">
                          <Fuel className="w-4 h-4" />
                        </span>
                        <h4 className="text-xs font-black text-slate-800">
                          {selectedCraneId === 'all' ? 'ملخص تليمتري أسطول الأوناش' : `تليمتري الونش: ${selectedCrane?.nameAr}`}
                        </h4>
                      </div>

                      {selectedCraneId === 'all' ? (
                        /* General summary stats */
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/80 p-3 rounded-xl border border-white shadow-3xs">
                              <span className="text-[10px] text-slate-400 font-bold block">إجمالي أوناش الأسطول</span>
                              <span className="text-base font-black text-slate-800 font-mono">{fleetKpis.count} أوناش</span>
                            </div>
                            <div className="bg-white/80 p-3 rounded-xl border border-white shadow-3xs">
                              <span className="text-[10px] text-slate-400 font-bold block">المعدل التشغيلي الحالي</span>
                              <span className="text-base font-black text-emerald-600 font-mono">{Math.round((fleetKpis.running / fleetKpis.count) * 100)}%</span>
                            </div>
                          </div>

                          <div className="bg-white/80 p-4 rounded-xl border border-white shadow-3xs space-y-3.5">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                              <span>أوناش في حالة التشغيل الميداني:</span>
                              <span className="text-emerald-600 font-black">{fleetKpis.running} أوناش</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                              <span>أوناش جاهزة / في الانتظار:</span>
                              <span className="text-amber-500 font-black">{fleetKpis.idle} أوناش</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                              <span>أوناش قيد الصيانة بالورشة:</span>
                              <span className="text-rose-500 font-black">{fleetKpis.maintenance} أوناش</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Specific Crane telemetry stats */
                        selectedCrane && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between bg-white/80 p-3 rounded-xl border border-white shadow-3xs">
                              <span className="text-[10px] text-slate-500 font-bold">الحالة التشغيلية الحالية:</span>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                selectedCrane.status === 'running' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                selectedCrane.status === 'idle' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {selectedCrane.status === 'running' ? '● تشغيل ميداني' : selectedCrane.status === 'idle' ? '● وضع جاهزية' : '● صيانة بالورشة'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white/80 p-3 rounded-xl border border-white shadow-3xs space-y-1">
                                <span className="text-[10px] text-slate-400 font-bold block">مستوى وقود الخزان</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-black text-slate-800 font-mono">{selectedCrane.fuelLevel}%</span>
                                  <span className="w-2.5 h-2.5 rounded bg-emerald-500" style={{ opacity: selectedCrane.fuelLevel / 100 }} />
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                                  <div className="h-full bg-emerald-500" style={{ width: `${selectedCrane.fuelLevel}%` }} />
                                </div>
                              </div>

                              <div className="bg-white/80 p-3 rounded-xl border border-white shadow-3xs space-y-1">
                                <span className="text-[10px] text-slate-400 font-bold block">السرعة الميدانية</span>
                                <span className="text-sm font-black text-slate-800 font-mono">{selectedCrane.speed} كم/س</span>
                                <span className="text-[8px] text-slate-400 block font-bold">محركات ديزل مجهزة</span>
                              </div>
                            </div>

                            {/* GPS Coordinates representation with high-end tech style */}
                            <div className="bg-white/80 p-3 rounded-xl border border-white shadow-3xs space-y-2">
                              <span className="text-[10px] text-slate-400 font-bold block">الإحداثيات الجغرافية النشطة:</span>
                              <div className="grid grid-cols-2 gap-2 text-center text-xs bg-slate-50 p-2 rounded-lg font-mono font-bold">
                                <div>
                                  <span className="text-[8px] text-slate-400 block font-sans">خط العرض</span>
                                  <span className="text-slate-800">{selectedCrane.lat.toFixed(4)}</span>
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-400 block font-sans">خط الطول</span>
                                  <span className="text-slate-800">{selectedCrane.lng.toFixed(4)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    <div className="bg-white/50 backdrop-blur-md p-3 rounded-xl border border-white/60 space-y-1.5 mt-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                        <span>السائق المعتمد بالوردية:</span>
                        <span className="text-slate-800 font-black">{selectedCraneId === 'all' ? 'سائقين معتمدين' : selectedCrane?.operatorName}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                        <span>رقم اللوحة المرورية:</span>
                        <span className="text-slate-800 font-mono font-black">{selectedCraneId === 'all' ? 'رقم لوحة مسجلة' : selectedCrane?.plateNumber || 'غير متوفر'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* -------------------- TAB 3: Maintenance & Safety -------------------- */}
            {activeKpiTab === 'maintenance_safety' && (
              <>
                {/* Left side: charts */}
                <div className="xl:col-span-8 space-y-4">
                  {/* Filter by Type */}
                  <div className="bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-3xs space-y-2">
                    <span className="text-[11px] font-black text-slate-500 block mb-1">نوع أمر صيانة السلامة:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedMaintType('all')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedMaintType === 'all'
                            ? 'bg-[#0F4C81]/15 text-[#0F4C81] border border-[#0F4C81]'
                            : 'bg-white/40 border border-slate-200/60 hover:bg-white text-slate-600'
                        }`}
                      >
                        جميع أوامر الصيانة
                      </button>
                      <button
                        onClick={() => setSelectedMaintType('preventive')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedMaintType === 'preventive'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : 'bg-white/40 border border-slate-200/60 hover:bg-white text-slate-600'
                        }`}
                      >
                        الصيانة الوقائية (Preventive)
                      </button>
                      <button
                        onClick={() => setSelectedMaintType('corrective')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedMaintType === 'corrective'
                            ? 'bg-rose-50 text-rose-700 border border-rose-300'
                            : 'bg-white/40 border border-slate-200/60 hover:bg-white text-slate-600'
                        }`}
                      >
                        الصيانة الطارئة / الإصلاحية (Corrective)
                      </button>
                    </div>
                  </div>

                  {/* Recharts chart */}
                  <div className="bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-white/60 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-slate-800">توزيع تكاليف صيانة الأوناش بالقسم (مقارنة نوعية)</h3>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-black px-2 py-0.5 rounded border border-emerald-200">الوقائي يعزز سلامة الأرواح</span>
                    </div>

                    <div className="h-[260px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={maintenanceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="name" stroke="#6B7280" fontSize={10} tickLine={false} />
                          <YAxis stroke="#6B7280" fontSize={10} tickLine={false} tickFormatter={(v) => `${(v / 1000).toLocaleString()}k`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: '1px solid #E2E8F0', direction: 'rtl', textAlign: 'right' }}
                            formatter={(value: any, name: any) => {
                              const label = name === 'preventive' ? 'وقائية' : name === 'corrective' ? 'إصلاحية طارئة' : 'إجمالي النفقات';
                              return [`${Number(value).toLocaleString()} ج.م`, label];
                            }}
                          />
                          <Legend verticalAlign="top" height={36} iconType="circle" />
                          <Bar name="preventive" dataKey="preventive" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                          <Bar name="corrective" dataKey="corrective" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Right side: details and safety advisory */}
                <div className="xl:col-span-4 space-y-4">
                  <div className="bg-emerald-500/5 backdrop-blur-md p-5 rounded-2xl border border-emerald-500/15 shadow-3xs space-y-4 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center gap-1.5 border-b border-slate-200/50 pb-2.5 mb-3.5">
                        <span className="p-1 bg-emerald-600 rounded-lg text-white">
                          <ShieldCheck className="w-4 h-4" />
                        </span>
                        <h4 className="text-xs font-black text-slate-800">معدلات الأمان والجاهزية الفنية</h4>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white/80 p-4 rounded-xl border border-white shadow-3xs space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                            <span>إجمالي تكلفة صيانة الوردية:</span>
                            <span className="font-black text-slate-800 font-mono">{maintenanceKpis.totalCost.toLocaleString()} ج.م</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                            <span>أوامر الصيانة المنجزة بنجاح:</span>
                            <span className="text-emerald-600 font-black">{maintenanceKpis.completed} أمر صيانة</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                            <span>أوامر صيانة قيد التنفيذ:</span>
                            <span className="text-amber-500 font-black">{maintenanceKpis.inProgress} أمر صيانة</span>
                          </div>
                        </div>

                        {/* Completion Ring gauge */}
                        <div className="bg-white/80 p-4 rounded-xl border border-white shadow-3xs space-y-3 text-center">
                          <span className="text-[10px] text-slate-400 font-black block">معدل استجابة الصيانة وإغلاق البلاغات</span>
                          <div className="inline-flex items-center justify-center relative">
                            <svg className="w-16 h-16 transform -rotate-90">
                              <circle cx="32" cy="32" r="28" strokeWidth="6" stroke="#f1f5f9" fill="transparent" />
                              <circle 
                                cx="32" 
                                cy="32" 
                                r="28" 
                                strokeWidth="6" 
                                stroke="#10b981" 
                                fill="transparent" 
                                strokeDasharray={2 * Math.PI * 28}
                                strokeDashoffset={2 * Math.PI * 28 * (1 - maintenanceKpis.rate / 100)}
                                className="transition-all duration-1000"
                              />
                            </svg>
                            <span className="absolute text-xs font-black text-slate-800">{maintenanceKpis.rate}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Industrial safety recommendation badge */}
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-1.5 mt-2">
                      <span className="text-[10px] bg-amber-500 text-white font-black px-1.5 py-0.5 rounded inline-block">توصية أمنية معتمدة</span>
                      <p className="text-[10px] text-amber-800 leading-relaxed font-bold">
                        {maintenanceKpis.rate < 70 
                          ? 'تحذير: معدل إنجاز الصيانة منخفض. ينصح بتركيز الجهود لإغلاق أوامر الصيانة الطارئة لضمان مستويات الأمان بالمواقع.' 
                          : 'مستوى السلامة مستقر. استمر بجدولة الصيانة الوقائية الفورية لرافعات Liebherr لتقليل فترات التعطل المفاجئة.'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Main Charts & Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Financial Flow Area Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">التحليل المالي السنوي</h3>
              <p className="text-xs text-slate-400">مقارنة الإيرادات، المصاريف وصافي أرباح أسطول الأوناش (بالجنيه المصري)</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-full text-slate-600">٢٠٢٦</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F4C81" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0F4C81" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString()} ج.م`]} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area type="monotone" name="إجمالي الإيرادات" dataKey="revenue" stroke="#0F4C81" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" name="صافي الأرباح" dataKey="profit" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fleet Status Pie Chart */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">جاهزية أسطول الأوناش</h3>
            <p className="text-xs text-slate-400">توزيع الحالة التشغيلية لرافعات Egypt Cranes</p>
          </div>
          <div className="h-[180px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={craneStatusPie}
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {craneStatusPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="block text-2xl font-black text-slate-800">{cranes.length}</span>
              <span className="text-xs text-slate-400">إجمالي الأوناش</span>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-50">
            {craneStatusPie.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-500 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800">{item.value} ونش ({Math.round((item.value / cranes.length) * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Bar Chart: Crane Utilization Rate */}
        <div className={`lg:col-span-6 ${!widgetSettings.operationalAlerts ? 'lg:col-span-12' : ''} bg-white p-6 rounded-2xl border shadow-sm space-y-4 transition-all duration-300`}>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">معدل استخدام الأوناش الفردي</h3>
            <p className="text-xs text-slate-400">نسبة ساعات التشغيل والفعالية الفردية لكل رافعة رئيسية</p>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} domain={[0, 100]} unit="%" />
                <Tooltip formatter={(v) => [`${v}%`, 'معدل الكفاءة']} />
                <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                  {utilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.rate > 80 ? '#0F4C81' : entry.rate > 50 ? '#F7941D' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions & Recent Activities / Operational Alerts */}
        {widgetSettings.operationalAlerts && (
          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-between space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500 animate-bounce" />
                <span>{language === 'ar' ? 'تنبيهات التشغيل والأنشطة الأخيرة' : 'Operational Alerts & Activities'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'ar' ? 'تنبيهات الأمان الحرجة والأنشطة اللوجستية النشطة' : 'Critical security alerts & active logistics logs'}
              </p>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[220px] pr-1">
              {/* Alert 1: Maintenance Exceeded */}
              <div className="flex gap-3 text-xs bg-rose-50/50 p-2.5 rounded-xl border border-rose-100">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold flex-shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-rose-950 font-extrabold">{language === 'ar' ? 'تنبيه صيانة عاجل' : 'Urgent Maintenance Alert'}</p>
                  <p className="text-rose-800 mt-0.5">
                    {language === 'ar' 
                      ? 'الونش Liebherr EC-CR-100 تخطى موعد الصيانة الدورية بـ ٣ أيام بموقع العاصمة الإدارية.' 
                      : 'Liebherr EC-CR-100 crane is 3 days overdue for scheduled inspection at New Capital site.'}
                  </p>
                  <span className="text-rose-400 text-[10px] block mt-1">منذ ٥ دقائق • نظام المتابعة</span>
                </div>
              </div>

              {/* Alert 2: Low Fuel */}
              <div className="flex gap-3 text-xs bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold flex-shrink-0">
                  <Fuel className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-amber-950 font-extrabold">{language === 'ar' ? 'مستوى وقود منخفض' : 'Low Fuel Level Warning'}</p>
                  <p className="text-amber-800 mt-0.5">
                    {language === 'ar' 
                      ? 'مستوى وقود ونش Terex منخفض للغاية (١٢٪) بموقع مشروع سد أسيوط.' 
                      : 'Terex crane fuel level is critically low (12%) at Assiut Dam project site.'}
                  </p>
                  <span className="text-amber-400 text-[10px] block mt-1">منذ ٢٥ دقيقة • مستشعر IoT التشغيلي</span>
                </div>
              </div>

              {/* Activity 1 */}
              <div className="flex gap-3 text-xs p-1">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-slate-800 font-bold">{language === 'ar' ? 'خروج ونش تلسكوبي' : 'Telescopic Crane Dispatch'}</p>
                  <p className="text-slate-400 mt-0.5">
                    {language === 'ar' 
                      ? 'خروج الونش ديمباج EC-CR-250 باتجاه فندق الأيقونة - حمولة ٢٥٠ طن' 
                      : 'Demag EC-CR-250 crane dispatched to Iconic Hotel project - 250T load capacity'}
                  </p>
                  <span className="text-slate-300 text-[10px] block mt-1">منذ ساعة • البوابة الأمنية</span>
                </div>
              </div>

              {/* Activity 2 */}
              <div className="flex gap-3 text-xs p-1">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-slate-800 font-bold">{language === 'ar' ? 'اعتماد فاتورة مبيعات' : 'Sales Invoice Approved'}</p>
                  <p className="text-slate-400 mt-0.5">
                    {language === 'ar' 
                      ? 'اعتماد الفاتورة INV-2026-101 بمبلغ ٤٥٠,٠٠٠ ج.م للعميل المقاولون العرب' 
                      : 'Invoice INV-2026-101 for 450,000 EGP approved for Arab Contractors client'}
                  </p>
                  <span className="text-slate-300 text-[10px] block mt-1">منذ ساعتين • الإدارة المالية</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 🔍 KPI Details Breakdown Modal Overlay */}
      <AnimatePresence>
        {selectedKpiDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto" id="kpi-details-modal-container">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedKpiDetail(null)}
              className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity cursor-pointer"
              id="kpi-details-modal-backdrop"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-5xl w-full max-h-[85vh] flex flex-col overflow-hidden z-10"
              id="kpi-details-modal-box"
            >
              {/* Top accent line */}
              <div className={`h-2.5 w-full bg-gradient-to-r ${
                selectedKpiDetail === 'trips' ? 'from-blue-500 to-indigo-600' :
                selectedKpiDetail === 'maintenance' ? 'from-amber-400 to-orange-500' :
                selectedKpiDetail === 'utilization' ? 'from-emerald-400 to-teal-600' :
                'from-indigo-500 to-purple-600'
              }`} />

              {/* Close Button */}
              <button
                onClick={() => setSelectedKpiDetail(null)}
                className="absolute top-5 left-5 md:left-6 md:top-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-20"
                title={language === 'ar' ? 'إغلاق' : 'Close'}
                id="kpi-details-modal-close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="p-6 md:p-8 pb-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl border ${
                      selectedKpiDetail === 'trips' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      selectedKpiDetail === 'maintenance' ? 'bg-amber-50 text-[#F7941D] border-amber-100' :
                      selectedKpiDetail === 'utilization' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      'bg-indigo-50 text-indigo-600 border-indigo-100'
                    }`}>
                      {selectedKpiDetail === 'trips' ? <Truck className="w-5 h-5" /> :
                       selectedKpiDetail === 'maintenance' ? <Clock className="w-5 h-5" /> :
                       selectedKpiDetail === 'utilization' ? <Activity className="w-5 h-5" /> :
                       <Sparkles className="w-5 h-5" />}
                    </div>
                    <h3 className="text-lg md:text-xl font-black text-slate-800">
                      {selectedKpiDetail === 'trips' && (language === 'ar' ? 'تقرير رحلات الحركة التفصيلي' : 'Detailed Trip Logs & Logistics')}
                      {selectedKpiDetail === 'maintenance' && (language === 'ar' ? 'أوامر وجدولة صيانة الأسطول' : 'Maintenance Orders & Turnaround')}
                      {selectedKpiDetail === 'utilization' && (language === 'ar' ? 'تقرير كفاءة وتشغيل الأوناش الفردي' : 'Individual Crane Fleet Utilization')}
                      {selectedKpiDetail === 'predictive' && (language === 'ar' ? 'مصفوفة التوقعات التشغيلية المستقبلية' : 'Regressive Predictive Outlook Matrix')}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    {selectedKpiDetail === 'trips' && (language === 'ar' ? 'سجل كامل للرحلات الفردية المجدولة والنشطة في نطاق الفترة المحددة' : 'Live and historic logs of individual fleet transport and dispatch trips within selected range')}
                    {selectedKpiDetail === 'maintenance' && (language === 'ar' ? 'تفاصيل أعمال الصيانة الوقائية والطارئة وسجل التكلفة مع متوسط أوقات الإنجاز' : 'Detailed report of technical work orders, service costs, and response times for the active period')}
                    {selectedKpiDetail === 'utilization' && (language === 'ar' ? 'متابعة تشغيلية فورية للرافعات، مستويات الوقود الذكية، وسرعة حركة المعدات' : 'Real-time telemetry breakdown of running, idle or maintenance status of each individual crane asset')}
                    {selectedKpiDetail === 'predictive' && (language === 'ar' ? 'نمذجة التوقعات المبنية على الانحدار الخطي للـ ٣٠ يوماً القادمة مع أداة محاكاة تفاعلية' : 'Statistical linear regression modeling for upcoming 30 days utilization forecast with interactive simulation controls')}
                  </p>
                </div>

                {/* Info badge */}
                <div className="text-right flex flex-col items-start md:items-end flex-shrink-0">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">
                    {language === 'ar' ? 'فترة التحليل المطبقة' : 'Applied analysis period'}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg mt-0.5 inline-block">
                    {computedInterval.start} ⇄ {computedInterval.end}
                  </span>
                </div>
              </div>

              {/* Controls Bar (Search & Filter - Hidden for Predictive View) */}
              {selectedKpiDetail !== 'predictive' && (
                <div className="px-6 md:px-8 py-3 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner">
                  {/* Search box */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder={
                        selectedKpiDetail === 'trips' ? (language === 'ar' ? 'البحث برقم الرحلة، الونش، السائق، الوجهة...' : 'Search by trip #, crane, driver, destination...') :
                        selectedKpiDetail === 'maintenance' ? (language === 'ar' ? 'البحث برقم الأمر، الونش، الوصف...' : 'Search by order #, crane, description...') :
                        (language === 'ar' ? 'البحث بكود الرافعة، الموديل، المشغل...' : 'Search by crane code, model, operator...')
                      }
                      value={detailSearch}
                      onChange={(e) => setDetailSearch(e.target.value)}
                      className="w-full pr-10 pl-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 shadow-sm"
                    />
                    {detailSearch && (
                      <button 
                        onClick={() => setDetailSearch('')} 
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        {language === 'ar' ? 'مسح' : 'Clear'}
                      </button>
                    )}
                  </div>

                  {/* Filter select list */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Filter className="w-3.5 h-3.5 text-[#0F4C81]" />
                      <span>{language === 'ar' ? 'تصفية حسب:' : 'Filter:'}</span>
                    </div>

                    {/* Status Filter Dropdown */}
                    <select
                      value={detailStatusFilter}
                      onChange={(e) => setDetailStatusFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 shadow-sm"
                    >
                      <option value="all">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
                      {selectedKpiDetail === 'trips' && (
                        <>
                          <option value="active">{language === 'ar' ? 'نشط حالياً' : 'Active Only'}</option>
                          <option value="completed">{language === 'ar' ? 'مكتمل' : 'Completed Only'}</option>
                        </>
                      )}
                      {selectedKpiDetail === 'maintenance' && (
                        <>
                          <option value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</option>
                          <option value="in_progress">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</option>
                          <option value="pending">{language === 'ar' ? 'معلق / بانتظار الاعتماد' : 'Pending Approval'}</option>
                        </>
                      )}
                      {selectedKpiDetail === 'utilization' && (
                        <>
                          <option value="running">{language === 'ar' ? 'في العمل الميداني (يعمل)' : 'Running (On Field)'}</option>
                          <option value="idle">{language === 'ar' ? 'جاهز ومتوقف (خامل)' : 'Idle (Ready)'}</option>
                          <option value="maintenance">{language === 'ar' ? 'في الصيانة الفنية' : 'In Maintenance'}</option>
                        </>
                      )}
                    </select>

                    {/* Additional maintenance type filter */}
                    {selectedKpiDetail === 'maintenance' && (
                      <select
                        value={detailTypeFilter}
                        onChange={(e) => setDetailTypeFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 shadow-sm"
                      >
                        <option value="all">{language === 'ar' ? 'جميع أنواع الصيانة' : 'All Types'}</option>
                        <option value="preventive">{language === 'ar' ? 'صيانة وقائية دورية' : 'Preventive Maintenance'}</option>
                        <option value="corrective">{language === 'ar' ? 'إصلاح طارئ (تصحيحي)' : 'Corrective Repairs'}</option>
                      </select>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Scrollable Core Content */}
              <div className="p-6 md:p-8 flex-1 overflow-y-auto max-h-[50vh]" id="kpi-details-modal-scrollable-body">
                {/* VIEW 1: TRIPS BREAKDOWN */}
                {selectedKpiDetail === 'trips' && (
                  <div className="space-y-4">
                    {/* Top Stats summary row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-blue-50/40 p-4 rounded-2xl border border-blue-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ar' ? 'إجمالي رحلات الفترة' : 'Total period trips'}</span>
                        <span className="text-xl font-mono font-black text-slate-700">{modalTrips.length}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ar' ? 'الرحلات النشطة' : 'Active trips'}</span>
                        <span className="text-xl font-mono font-black text-blue-600">{modalTrips.filter(t => t.status === 'active').length}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ar' ? 'الرحلات المكتملة' : 'Completed trips'}</span>
                        <span className="text-xl font-mono font-black text-emerald-600">{modalTrips.filter(t => t.status === 'completed').length}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ar' ? 'معدل التغطية الفعلي' : 'Fleet coverage rate'}</span>
                        <span className="text-xl font-mono font-black text-[#F7941D]">
                          {cranes.length > 0 ? Math.round((new Set(modalTrips.map(t => t.craneId)).size / cranes.length) * 100) : 0}%
                        </span>
                      </div>
                    </div>

                    {modalTrips.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        {language === 'ar' ? 'لا توجد سجلات رحلات مطابقة للبحث أو التصفية الحالية.' : 'No trip records match the current search or filters.'}
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100">
                            <tr>
                              <th className="p-3.5 text-center">{language === 'ar' ? 'رقم الرحلة' : 'Trip No.'}</th>
                              <th className="p-3.5">{language === 'ar' ? 'اسم الرافعة' : 'Crane'}</th>
                              <th className="p-3.5">{language === 'ar' ? 'اسم السائق' : 'Driver'}</th>
                              <th className="p-3.5">{language === 'ar' ? 'رقم مركبة النقل' : 'Transport Vehicle'}</th>
                              <th className="p-3.5">{language === 'ar' ? 'بوابة الخروج' : 'Dispatch Gate'}</th>
                              <th className="p-3.5">{language === 'ar' ? 'الوجهة والمشروع' : 'Destination'}</th>
                              <th className="p-3.5">{language === 'ar' ? 'المغادرة' : 'Departure'}</th>
                              <th className="p-3.5">{language === 'ar' ? 'الوصول المتوقع' : 'Arrival'}</th>
                              <th className="p-3.5 text-center">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {modalTrips.map((trip) => (
                              <tr key={trip.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="p-3.5 text-center font-bold font-mono text-[#0F4C81]">{trip.tripNo}</td>
                                <td className="p-3.5 font-bold text-slate-800">{trip.craneName}</td>
                                <td className="p-3.5 font-medium">{trip.driverName}</td>
                                <td className="p-3.5 font-mono text-[11px] text-slate-500">{trip.vehicleCode}</td>
                                <td className="p-3.5">{trip.departureGate}</td>
                                <td className="p-3.5 font-semibold text-[#0F4C81]">{trip.destination}</td>
                                <td className="p-3.5 font-mono text-[11px] text-slate-500">{trip.departureTime}</td>
                                <td className="p-3.5 font-mono text-[11px] text-slate-500">{trip.arrivalTime || '-'}</td>
                                <td className="p-3.5 text-center">
                                  {trip.status === 'active' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-extrabold border border-blue-100">
                                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                      {language === 'ar' ? 'نشط حالياً' : 'Active'}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-400 rounded-full text-[10px] font-bold border border-slate-200">
                                      {language === 'ar' ? 'مكتملة' : 'Completed'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* VIEW 2: MAINTENANCE ORDERS */}
                {selectedKpiDetail === 'maintenance' && (
                  <div className="space-y-4">
                    {/* Top Stats summary row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-amber-50/40 p-4 rounded-2xl border border-amber-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ar' ? 'إجمالي أوامر الفترة' : 'Total period orders'}</span>
                        <span className="text-xl font-mono font-black text-slate-700">{modalMaintenance.length}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ar' ? 'إجمالي تكلفة الصيانة' : 'Total service cost'}</span>
                        <span className="text-xl font-mono font-black text-emerald-600">
                          {modalMaintenance.reduce((sum, o) => sum + o.cost, 0).toLocaleString()} {language === 'ar' ? 'ج.م' : 'EGP'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ar' ? 'صيانة طارئة (إصلاح)' : 'Corrective orders'}</span>
                        <span className="text-xl font-mono font-black text-[#F7941D]">{modalMaintenance.filter(o => o.type === 'corrective').length}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ar' ? 'صيانة وقائية (دورية)' : 'Preventive orders'}</span>
                        <span className="text-xl font-mono font-black text-blue-600">{modalMaintenance.filter(o => o.type === 'preventive').length}</span>
                      </div>
                    </div>

                    {modalMaintenance.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        {language === 'ar' ? 'لا توجد أوامر صيانة فنية مطابقة لخيارات البحث الحالية.' : 'No work orders match the current search or filter parameters.'}
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100">
                            <tr>
                              <th className="p-3.5 text-center">{language === 'ar' ? 'رقم الأمر' : 'Order No.'}</th>
                              <th className="p-3.5">{language === 'ar' ? 'الرافعة المستهدفة' : 'Target Crane'}</th>
                              <th className="p-3.5 text-center">{language === 'ar' ? 'نوع الصيانة' : 'Maintenance Type'}</th>
                              <th className="p-3.5 text-center">{language === 'ar' ? 'المدة المقدرة' : 'Est. Duration'}</th>
                              <th className="p-3.5 text-right">{language === 'ar' ? 'التكلفة المالية' : 'Financial Cost'}</th>
                              <th className="p-3.5">{language === 'ar' ? 'تاريخ الجدولة' : 'Schedule Date'}</th>
                              <th className="p-3.5">{language === 'ar' ? 'الوصف الفني للمشكلة والحل' : 'Technical Description'}</th>
                              <th className="p-3.5 text-center">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {modalMaintenance.map((order) => (
                              <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="p-3.5 text-center font-bold font-mono text-[#F7941D]">{order.orderNo}</td>
                                <td className="p-3.5 font-bold text-slate-800">{order.craneName}</td>
                                <td className="p-3.5 text-center">
                                  {order.type === 'preventive' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-bold border border-blue-100">
                                      {language === 'ar' ? 'وقائية دورية' : 'Preventive'}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[9px] font-bold border border-amber-100">
                                      {language === 'ar' ? 'إصلاح طارئ' : 'Corrective'}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3.5 text-center font-semibold text-slate-500 font-mono">
                                  {order.type === 'preventive' ? '8 hrs' : '48 hrs'}
                                </td>
                                <td className="p-3.5 text-right font-bold font-mono text-emerald-600">
                                  {order.cost.toLocaleString()} {language === 'ar' ? 'ج.م' : 'EGP'}
                                </td>
                                <td className="p-3.5 font-mono text-slate-500 text-[11px]">{order.date}</td>
                                <td className="p-3.5 max-w-xs truncate font-medium text-slate-500" title={order.description}>{order.description}</td>
                                <td className="p-3.5 text-center">
                                  {order.status === 'completed' && (
                                    <span className="inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-extrabold border border-emerald-100">
                                      {language === 'ar' ? 'منجز بالكامل' : 'Completed'}
                                    </span>
                                  )}
                                  {order.status === 'in_progress' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-extrabold border border-blue-100">
                                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                                      {language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}
                                    </span>
                                  )}
                                  {order.status === 'pending' && (
                                    <span className="inline-flex items-center px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-extrabold border border-amber-100">
                                      {language === 'ar' ? 'بانتظار الاعتماد' : 'Pending'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* VIEW 3: INDIVIDUAL CRANE FLEET UTILIZATION */}
                {selectedKpiDetail === 'utilization' && (
                  <div className="space-y-4">
                    {/* Top Stats summary row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ar' ? 'أوناش الأسطول الإجمالية' : 'Total crane assets'}</span>
                        <span className="text-xl font-mono font-black text-slate-700">{cranes.length}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ar' ? 'الأوناش المشغلة حالياً' : 'Cranes active now'}</span>
                        <span className="text-xl font-mono font-black text-emerald-600">{runningCranes}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ar' ? 'الأوناش الشاغرة (خامدة)' : 'Cranes idle (ready)'}</span>
                        <span className="text-xl font-mono font-black text-amber-600">{idleCranes}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ar' ? 'الأوناش في الصيانة الفنية' : 'Cranes in maintenance'}</span>
                        <span className="text-xl font-mono font-black text-rose-600">{maintCranes}</span>
                      </div>
                    </div>

                    {modalCranes.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        {language === 'ar' ? 'لا توجد أوناش مطابقة لمعايير البحث المطلوبة.' : 'No heavy cranes found matching the specified parameters.'}
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100">
                            <tr>
                              <th className="p-3.5 text-center">{language === 'ar' ? 'كود الونش' : 'Crane Code'}</th>
                              <th className="p-3.5">{language === 'ar' ? 'اسم ونموذج الرافعة' : 'Name & Model'}</th>
                              <th className="p-3.5 text-center">{language === 'ar' ? 'حمولة الحمولة الكبرى' : 'Max Capacity'}</th>
                              <th className="p-3.5">{language === 'ar' ? 'رقم اللوحة المرورية' : 'Plate Number'}</th>
                              <th className="p-3.5">{language === 'ar' ? 'المشغل الفني المعتمد' : 'Assigned Operator'}</th>
                              <th className="p-3.5 text-center">{language === 'ar' ? 'سرعة الحركة' : 'Current Speed'}</th>
                              <th className="p-3.5">{language === 'ar' ? 'مستوى الوقود' : 'Fuel Level'}</th>
                              <th className="p-3.5 text-center">{language === 'ar' ? 'الحالة التشغيلية' : 'Status'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {modalCranes.map((crane) => (
                              <tr key={crane.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="p-3.5 text-center font-bold font-mono text-emerald-700">{crane.code}</td>
                                <td className="p-3.5">
                                  <div>
                                    <span className="font-bold text-slate-800 block">{crane.nameAr}</span>
                                    <span className="text-[10px] text-slate-400 block font-medium mt-0.5">{crane.model}</span>
                                  </div>
                                </td>
                                <td className="p-3.5 text-center font-bold text-[#0F4C81] font-mono">
                                  {crane.capacity} {language === 'ar' ? 'طن' : 'Tons'}
                                </td>
                                <td className="p-3.5 font-mono text-slate-500">{crane.plateNumber}</td>
                                <td className="p-3.5 font-medium">{crane.operatorName || '-'}</td>
                                <td className="p-3.5 text-center font-bold font-mono text-indigo-600">
                                  {crane.status === 'running' ? `${crane.speed} km/h` : '0 km/h'}
                                </td>
                                <td className="p-3.5 min-w-[130px]">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                                      <div 
                                        className={`h-full rounded-full ${
                                          crane.fuelLevel <= 15 ? 'bg-rose-500' :
                                          crane.fuelLevel <= 35 ? 'bg-amber-500' :
                                          'bg-emerald-500'
                                        }`}
                                        style={{ width: `${crane.fuelLevel}%` }}
                                      />
                                    </div>
                                    <span className="font-mono font-bold text-slate-600 text-[11px]">{crane.fuelLevel}%</span>
                                  </div>
                                </td>
                                <td className="p-3.5 text-center">
                                  {crane.status === 'running' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-extrabold border border-emerald-100">
                                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                                      {language === 'ar' ? 'يعمل بالميدان' : 'Running'}
                                    </span>
                                  )}
                                  {crane.status === 'idle' && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-extrabold border border-amber-100">
                                      {language === 'ar' ? 'خامل جاهز' : 'Idle'}
                                    </span>
                                  )}
                                  {crane.status === 'maintenance' && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-extrabold border border-rose-100">
                                      {language === 'ar' ? 'قيد الصيانة' : 'In Repair'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* VIEW 4: PREDICTIVE MATRIX FORECAST & SIMULATOR */}
                {selectedKpiDetail === 'predictive' && (
                  <div className="space-y-6">
                    {/* Linear Regression Formula details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 col-span-1 md:col-span-2 space-y-3">
                        <span className="text-[10px] text-indigo-500 font-extrabold uppercase tracking-wider block">
                          {language === 'ar' ? 'المعادلة الرياضية ونظرية الاتجاه الخطي' : 'Linear regression analysis model'}
                        </span>
                        <div className="flex items-baseline gap-2.5">
                          <span className="text-3xl font-black text-indigo-600 font-mono tracking-wide bg-white px-4 py-1.5 rounded-xl shadow-sm border border-indigo-100/50">
                            {forecastData.formula}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {language === 'ar' ? 'معادلة الانحدار البسيط المعتمدة' : 'Simple regressive model applied'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                          {language === 'ar' 
                            ? 'يمثل المعامل (x) الفواصل الزمنية التشغيلية للأسابيع الماضية، فيما يشير المعامل الأساسي إلى القيمة الثابتة للمعدل. يعكس ميل المنحنى الاتجاه التصاعدي أو التنازلي لإجمالي الاحتياج اللوجيستي لمعدات الأسطول الثقيل بالميدان.' 
                            : 'Coefficient (x) maps the chronological sequence indices. The slope reflects direct weekly velocity increments or decrements in overall field logistics and crane deployment demands.'}
                        </p>
                      </div>

                      <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-purple-500 font-extrabold uppercase tracking-wider block">
                            {language === 'ar' ? 'معدل ميل المنحنى الفعلي (m)' : 'Slope Growth Coefficient (m)'}
                          </span>
                          <span className="text-3xl font-mono font-black text-purple-600 block mt-1">
                            {forecastData.slopePercent >= 0 ? '+' : ''}{forecastData.slopePercent}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {forecastData.slopePercent >= 0 
                            ? (language === 'ar' ? 'نمو تشغيلي تصاعدي مستدام' : 'Positive growth velocity') 
                            : (language === 'ar' ? 'انخفاض في نسبة كفاءة حركة الأسطول' : 'Negative demand trajectory')}
                        </p>
                      </div>
                    </div>

                    {/* DYNAMIC SCENARIO SIMULATOR CONTROL */}
                    <div className="p-6 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl text-white space-y-4 shadow-xl border border-indigo-800">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-extrabold flex items-center gap-1.5 text-indigo-300">
                            <Sparkles className="w-4 h-4 text-[#F7941D]" />
                            {language === 'ar' ? 'عربة محاكاة وتوقع الاحتمالات البديلة للأسطول' : 'Interactive Fleet Scenario Simulator'}
                          </h4>
                          <p className="text-[11px] text-indigo-200/80">
                            {language === 'ar' 
                              ? 'قم بسحب شريط التعديل لفرض زيادة أو نقصان في وتيرة التشغيل وراقب كيف ينعكس ذلك على التنبؤ اليومي لمعدل تشغيل الأوناش الإجمالي بالأسفل.' 
                              : 'Adjust the hypothesis coefficient factor below to simulate shift impacts on the upcoming 30-day projection daily metrics.'}
                          </p>
                        </div>
                        <div className="bg-indigo-950 px-3 py-1.5 rounded-xl border border-indigo-800 text-center flex-shrink-0">
                          <span className="text-[10px] text-indigo-400 font-bold block uppercase">{language === 'ar' ? 'فرضية التعديل' : 'Applied Shift Factor'}</span>
                          <span className="text-sm font-mono font-black text-indigo-300">{simulationOffset >= 0 ? '+' : ''}{simulationOffset}%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 py-2">
                        <span className="text-xs font-bold text-indigo-300">-15%</span>
                        <input
                          type="range"
                          min="-15"
                          max="15"
                          value={simulationOffset}
                          onChange={(e) => setSimulationOffset(parseInt(e.target.value))}
                          className="flex-1 accent-[#F7941D] bg-indigo-950 rounded-lg appearance-none h-2 cursor-pointer border border-indigo-800/60"
                        />
                        <span className="text-xs font-bold text-indigo-300">+15%</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-[10px] text-indigo-200/60">
                        <span>💡 {language === 'ar' ? 'سحب المؤشر لليسار لفرض زيادة الأعطال الفنية.' : 'Slide left to simulate high maintenance rates.'}</span>
                        <span>💡 {language === 'ar' ? 'سحب المؤشر لليمين لفرض دخول رافعات جديدة في مواقع الإنشاء.' : 'Slide right to simulate dispatch of new crane assets.'}</span>
                      </div>
                    </div>

                    {/* Projections Matrix Grid */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                        {language === 'ar' ? 'مصفوفة التوقعات الرقمية للـ ٣٠ يوماً القادمة (بناء على المحاكاة)' : 'Projected 30-Day Outlook Matrix Table (Based on Simulation)'}
                      </h4>

                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        {[5, 10, 15, 20, 25, 30].map((days) => {
                          // Calculate linear regression projection
                          const n = utilizationWeeklyData.length;
                          let sumX = 0;
                          let sumY = 0;
                          let sumXY = 0;
                          let sumXX = 0;
                          for (let i = 0; i < n; i++) {
                            sumX += i;
                            sumY += utilizationWeeklyData[i].rate;
                            sumXY += i * utilizationWeeklyData[i].rate;
                            sumXX += i * i;
                          }
                          const denominator = (n * sumXX - sumX * sumX);
                          const m = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
                          const c = denominator !== 0 ? (sumY - m * sumX) / n : sumY / n;

                          const projectedIndex = (n - 1) + (days / 5) * 0.8;
                          let originalProjected = Math.round(m * projectedIndex + c);
                          let simulatedProjected = Math.max(15, Math.min(100, originalProjected + simulationOffset));

                          return (
                            <div key={days} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/10 transition-colors flex flex-col justify-between space-y-2 text-center shadow-sm">
                              <div>
                                <span className="text-[11px] font-black text-[#0F4C81] block">
                                  {language === 'ar' ? `بعد +${days} يوم` : `Day +${days}`}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                                  {language === 'ar' ? 'المستهدف المتوقع' : 'Projected rate'}
                                </span>
                              </div>
                              <span className="text-2xl font-mono font-black text-slate-800 block">
                                {simulatedProjected}%
                              </span>
                              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-400 font-bold">
                                <span>{language === 'ar' ? 'ثقة النموذج' : 'Confidence'}</span>
                                <span className="text-emerald-600 font-mono">±4.8%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-5 md:px-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 font-semibold shadow-inner">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  {language === 'ar' ? 'البيانات المعروضة محدثة بشكل لحظي وتتبع النطاق التشغيلي النشط.' : 'Displayed reports are updated instantly matching selected date filter constraints.'}
                </span>
                <button
                  onClick={() => setSelectedKpiDetail(null)}
                  className="px-4 py-2 bg-[#0F4C81] text-white hover:bg-slate-800 text-xs font-bold rounded-xl shadow-sm transition-all duration-200"
                >
                  {language === 'ar' ? 'إغلاق ومتابعة التشغيل' : 'Close Details'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
