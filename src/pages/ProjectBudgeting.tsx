import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Plus, 
  Wrench, Users, Fuel, Briefcase, FileSpreadsheet, Percent, AlertCircle, CheckCircle,
  HelpCircle, Trash, RefreshCw, Calendar, Sparkles, LayoutGrid, Search, Landmark, ArrowLeftRight
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, LineChart, Line, ComposedChart, AreaChart, Area, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { CostCenter } from '../types';

interface ProjectBudgetingProps {
  costCenters: CostCenter[];
  onUpdateCostCenters: (items: CostCenter[]) => void;
}

// Define the detailed categories for the budget
interface BudgetCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  planned: number;
  actual: number;
  iconName: 'labor' | 'fuel' | 'logistics' | 'materials' | 'overhead';
}

// Map each CostCenter ID to its detailed categories allocation
interface ProjectAllocation {
  costCenterId: string;
  categories: BudgetCategory[];
}

export default function ProjectBudgeting({
  costCenters,
  onUpdateCostCenters
}: ProjectBudgetingProps) {
  
  // Initialize detailed category breakdowns for all projects
  const [projectAllocations, setProjectAllocations] = useState<ProjectAllocation[]>(() => {
    return costCenters.map(cc => ({
      costCenterId: cc.id,
      categories: [
        { id: '1', nameAr: 'أجور عمالة تشغيل أوناش مباشر', nameEn: 'Direct Operator & Crew Labor', planned: Math.round(cc.budget * 0.35), actual: Math.round(cc.usedBudget * 0.33), iconName: 'labor' },
        { id: '2', nameAr: 'سولار، زيوت ووقود أوناش ميداني', nameEn: 'Field Fuel, Oils & Energy', planned: Math.round(cc.budget * 0.25), actual: Math.round(cc.usedBudget * 0.28), iconName: 'fuel' },
        { id: '3', nameAr: 'خدمات لوجستية ونقل مساند للمشروع', nameEn: 'Logistics, Trailer Support & Rigging', planned: Math.round(cc.budget * 0.15), actual: Math.round(cc.usedBudget * 0.13), iconName: 'logistics' },
        { id: '4', nameAr: 'قطع غيار ومواد صيانة فورية للأوناش', nameEn: 'Crane Spare Parts & Mobile Repair', planned: Math.round(cc.budget * 0.15), actual: Math.round(cc.usedBudget * 0.16), iconName: 'materials' },
        { id: '5', nameAr: 'مصاريف موقع طوارئ ورسوم تراخيص', nameEn: 'Site Setup & Overhead Contingency', planned: Math.round(cc.budget * 0.10), actual: Math.round(cc.usedBudget * 0.10), iconName: 'overhead' },
      ]
    }));
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string>(costCenters[0]?.id || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Expense Logging Form States
  const [logAmount, setLogAmount] = useState('');
  const [logCategory, setLogCategory] = useState('1'); // Defaults to first category
  const [logDescription, setLogDescription] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().substring(0, 10));
  
  // Budget Adjustment Form States
  const [editCategory, setEditCategory] = useState<BudgetCategory | null>(null);
  const [newPlannedValue, setNewPlannedValue] = useState('');

  // Active Selected Cost Center object
  const selectedProject = useMemo(() => {
    return costCenters.find(cc => cc.id === selectedProjectId) || null;
  }, [costCenters, selectedProjectId]);

  // Active Selected Project Allocation details
  const selectedAllocation = useMemo(() => {
    return projectAllocations.find(pa => pa.costCenterId === selectedProjectId) || null;
  }, [projectAllocations, selectedProjectId]);

  // Overall statistics for KPI Suite
  const kpis = useMemo(() => {
    const totalPlanned = costCenters.reduce((sum, cc) => sum + cc.budget, 0);
    const totalActual = costCenters.reduce((sum, cc) => sum + cc.usedBudget, 0);
    const remainingBudget = Math.max(0, totalPlanned - totalActual);
    const avgUtilization = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;
    
    // Variance is planned - actual
    const netVariance = totalPlanned - totalActual;
    
    return {
      totalPlanned,
      totalActual,
      remainingBudget,
      avgUtilization,
      netVariance
    };
  }, [costCenters]);

  // Sync / Update helper
  const handleUpdateAllocation = (updatedAllocations: ProjectAllocation[]) => {
    setProjectAllocations(updatedAllocations);
    
    // Now sync back with global costCenters state
    const newCostCenters = costCenters.map(cc => {
      const alloc = updatedAllocations.find(a => a.costCenterId === cc.id);
      if (alloc) {
        const sumPlanned = alloc.categories.reduce((sum, cat) => sum + cat.planned, 0);
        const sumActual = alloc.categories.reduce((sum, cat) => sum + cat.actual, 0);
        return {
          ...cc,
          budget: sumPlanned,
          usedBudget: sumActual
        };
      }
      return cc;
    });

    onUpdateCostCenters(newCostCenters);
  };

  // Log expense handler
  const handleLogExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || selectedProjectId === 'all' || !logAmount || parseFloat(logAmount) <= 0) return;
    
    const amountNum = parseFloat(logAmount);
    
    const updated = projectAllocations.map(alloc => {
      if (alloc.costCenterId === selectedProjectId) {
        return {
          ...alloc,
          categories: alloc.categories.map(cat => {
            if (cat.id === logCategory) {
              return {
                ...cat,
                actual: cat.actual + amountNum
              };
            }
            return cat;
          })
        };
      }
      return alloc;
    });

    handleUpdateAllocation(updated);
    
    // Reset form
    setLogAmount('');
    setLogDescription('');
    setLogDate(new Date().toISOString().substring(0, 10));
    
    // Alert or confirmation can be represented as a local banner or modal
  };

  // Define Planned Category Budget Handler
  const handleUpdatePlannedCategoryBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !editCategory || !newPlannedValue || parseFloat(newPlannedValue) < 0) return;
    
    const newValueNum = parseFloat(newPlannedValue);
    
    const updated = projectAllocations.map(alloc => {
      if (alloc.costCenterId === selectedProjectId) {
        return {
          ...alloc,
          categories: alloc.categories.map(cat => {
            if (cat.id === editCategory.id) {
              return {
                ...cat,
                planned: newValueNum
              };
            }
            return cat;
          })
        };
      }
      return alloc;
    });

    handleUpdateAllocation(updated);
    setEditCategory(null);
    setNewPlannedValue('');
  };

  // Recharts Chart Data for overall comparison
  const projectsChartData = useMemo(() => {
    return costCenters.map(cc => {
      const variance = cc.budget - cc.usedBudget;
      const pct = cc.budget > 0 ? Math.round((cc.usedBudget / cc.budget) * 100) : 0;
      return {
        id: cc.id,
        name: cc.nameAr.length > 25 ? cc.nameAr.substring(0, 22) + '...' : cc.nameAr,
        planned: cc.budget,
        actual: cc.usedBudget,
        variance: variance,
        pct: pct
      };
    });
  }, [costCenters]);

  // Selected project category breakdown data
  const categoryBreakdownChartData = useMemo(() => {
    if (!selectedAllocation) return [];
    return selectedAllocation.categories.map(cat => {
      const variance = cat.planned - cat.actual;
      const variancePct = cat.planned > 0 ? Math.round((variance / cat.planned) * 100) : 0;
      return {
        name: cat.nameAr,
        planned: cat.planned,
        actual: cat.actual,
        variance: variance,
        variancePct: variancePct
      };
    });
  }, [selectedAllocation]);

  // Filter cost centers list
  const filteredCostCenters = useMemo(() => {
    return costCenters.filter(cc => 
      cc.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cc.managerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [costCenters, searchQuery]);

  // Utility to determine icon
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'labor': return <Users className="w-4 h-4 text-sky-600" />;
      case 'fuel': return <Fuel className="w-4 h-4 text-amber-600" />;
      case 'logistics': return <Briefcase className="w-4 h-4 text-indigo-600" />;
      case 'materials': return <Wrench className="w-4 h-4 text-rose-600" />;
      case 'overhead': return <FileSpreadsheet className="w-4 h-4 text-teal-600" />;
      default: return <DollarSign className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6 dir-rtl text-right font-sans" dir="rtl">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#0F4C81]/10 text-[#0F4C81] rounded-2xl border border-[#0F4C81]/20 shadow-3xs flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#0F4C81]" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">نظام إدارة ميزانيات المشاريع وتحليل الانحراف</h1>
          </div>
          <p className="text-sm text-slate-500 font-bold">
            تخطيط الموازنات التقديرية، رصد المصروفات التشغيلية الحقيقية وتوليد رسومات بيانية تفاعلية للانحراف المالي المباشر.
          </p>
        </div>

        {/* Global Action Link */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] bg-[#0F4C81]/10 text-[#0F4C81] px-2.5 py-1.5 rounded-xl border border-[#0F4C81]/20 font-black flex items-center gap-1">
            <Landmark className="w-3.5 h-3.5" />
            <span>نظام محاسبي نشط</span>
          </span>
        </div>
      </div>

      {/* KPI ribbon using Premium Glassmorphism cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total Planned Budget */}
        <div className="relative overflow-hidden bg-white/45 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between">
          <div className="absolute top-[-30px] right-[-30px] w-24 h-24 rounded-full bg-[#0F4C81]/5 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 block">إجمالي الموازنات المخططة</span>
            <span className="p-2 bg-slate-100 text-[#0F4C81] rounded-xl border border-slate-200/50">
              <FileSpreadsheet className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight font-mono">
              {kpis.totalPlanned.toLocaleString()}
            </h3>
            <span className="text-[10px] text-slate-400 font-bold mt-1 block">جنيه مصري (مشاريع نشطة)</span>
          </div>
        </div>

        {/* Card 2: Total Actual Expenses */}
        <div className="relative overflow-hidden bg-white/45 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between">
          <div className="absolute top-[-30px] right-[-30px] w-24 h-24 rounded-full bg-[#F7941D]/5 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 block">إجمالي المصروفات الفعلية</span>
            <span className="p-2 bg-[#F7941D]/10 text-[#F7941D] rounded-xl border border-[#F7941D]/20">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-[#0F4C81] tracking-tight font-mono">
              {kpis.totalActual.toLocaleString()}
            </h3>
            <span className="text-[10px] text-[#0F4C81]/70 font-bold mt-1 block">
              معدل استهلاك إجمالي: {kpis.avgUtilization}%
            </span>
          </div>
        </div>

        {/* Card 3: Overall Variance */}
        <div className="relative overflow-hidden bg-white/45 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between">
          <div className="absolute top-[-30px] right-[-30px] w-24 h-24 rounded-full bg-emerald-500/5 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 block">صافي الانحراف (وفر الموازنة)</span>
            <span className={`p-2 rounded-xl border ${
              kpis.netVariance >= 0 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                : 'bg-rose-50 text-rose-600 border-rose-100'
            }`}>
              {kpis.netVariance >= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            </span>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-black tracking-tight font-mono ${
              kpis.netVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {kpis.netVariance.toLocaleString()}
            </h3>
            <span className="text-[10px] font-bold mt-1 block text-slate-400">
              {kpis.netVariance >= 0 ? 'وفر آمن متبقي بالخزانة' : 'عجز في إجمالي المخطط الإنشائي'}
            </span>
          </div>
        </div>

        {/* Card 4: Global Health Index */}
        <div className="relative overflow-hidden bg-white/45 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between">
          <div className="absolute top-[-30px] right-[-30px] w-24 h-24 rounded-full bg-[#0F4C81]/5 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 block">كفاءة الإنفاق العام</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight font-mono">
              {(100 - kpis.avgUtilization)}%
            </h3>
            <span className="text-[10px] text-slate-400 font-bold mt-1 block">معدل الفائض أو هامش الأمان الإجمالي</span>
          </div>
        </div>

      </div>

      {/* Main interactive segment splits into: Selection List, Allocation Matrix & Logging, and Realtime Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Column 1: Projects Selector and mini panel (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white/45 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800">قائمة مشاريع الأوناش النشطة</h3>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded">مراكز التكلفة</span>
            </div>

            {/* Quick search */}
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث باسم المشروع أو الكود..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pr-9 pl-3 py-2 bg-white/70 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:bg-white"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            {/* Projects list */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredCostCenters.map(cc => {
                const isSelected = cc.id === selectedProjectId;
                const utilRate = cc.budget > 0 ? Math.round((cc.usedBudget / cc.budget) * 100) : 0;
                
                return (
                  <button
                    key={cc.id}
                    onClick={() => {
                      setSelectedProjectId(cc.id);
                      setEditCategory(null);
                    }}
                    className={`w-full text-right p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-[#0F4C81] text-white border-[#0F4C81] shadow-md shadow-blue-900/10'
                        : 'bg-white/60 hover:bg-white border-slate-100 hover:border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {cc.code}
                      </span>
                      <span className={`text-[10px] font-bold ${
                        utilRate >= 100 
                          ? 'text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded' 
                          : utilRate >= 80 
                            ? 'text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded' 
                            : 'text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded'
                      }`}>
                        {utilRate}% مستهلك
                      </span>
                    </div>

                    <h4 className="text-xs font-extrabold line-clamp-1">{cc.nameAr}</h4>
                    
                    <div className="flex justify-between items-center w-full text-[10px] pt-1 border-t border-dashed border-white/20">
                      <span className={isSelected ? 'text-white/80' : 'text-slate-400'}>
                        الميزانية: {cc.budget.toLocaleString()} ج.م
                      </span>
                      <span className={`font-black ${isSelected ? 'text-[#F7941D]' : 'text-[#0F4C81]'}`}>
                        المنصرف: {cc.usedBudget.toLocaleString()} ج.م
                      </span>
                    </div>
                  </button>
                );
              })}
              {filteredCostCenters.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400 font-bold">
                  لم يتم العثور على نتائج للبحث
                </div>
              )}
            </div>
          </div>

          {/* Quick info panel about project manager */}
          {selectedProject && (
            <div className="bg-white/45 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="p-1.5 bg-[#0F4C81]/10 text-[#0F4C81] rounded-lg">
                  <Users className="w-4 h-4" />
                </span>
                <h4 className="text-xs font-black text-slate-800">المهندس العام المسؤول للمشروع</h4>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-400">الاسم والصفة الفنية:</span>
                  <span className="text-slate-800">{selectedProject.managerName}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-400">القسم المالي التابع:</span>
                  <span className="text-slate-800">{selectedProject.department}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-400">موقع العمليات الميداني:</span>
                  <span className="text-slate-800 font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                    {selectedProject.code.startsWith('CC-NC') ? 'عاصمة إدارية جديدة - مصر' : 'الإسكندرية والوجه البحري'}
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-400">حالة تشغيل العطاء ماليًا:</span>
                  <span className="flex items-center gap-1 font-black text-emerald-600">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span>نشط وتحت المحاسبة</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Column 2: Selected Project Budget Planning and Logging (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Detailed categories grid with Glassmorphism */}
          <div className="bg-white/45 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0F4C81]" />
                  <span>تخطيط وتوزيع ميزانية: {selectedProject?.nameAr}</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-bold">
                  حدد ميزانيات تفصيلية لكل بند تشغيل، وقارن الإنفاق الفعلي لضمان هامش الربحية.
                </p>
              </div>
              <span className="text-xs font-mono font-black text-[#0F4C81] bg-slate-100 px-2.5 py-1 rounded-xl self-start sm:self-auto">
                كود الموازنة: {selectedProject?.code}
              </span>
            </div>

            {/* List of Detailed allocations */}
            <div className="space-y-4">
              {selectedAllocation?.categories.map(cat => {
                const variance = cat.planned - cat.actual;
                const utilRate = cat.planned > 0 ? Math.round((cat.actual / cat.planned) * 100) : 0;
                const isOverBudget = utilRate > 100;

                return (
                  <div 
                    key={cat.id}
                    className="p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-100 hover:border-slate-200 shadow-3xs hover:shadow-xs transition-all duration-300 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
                          {getCategoryIcon(cat.iconName)}
                        </span>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-800">{cat.nameAr}</h4>
                          <span className="text-[10px] text-slate-400 font-bold block">{cat.nameEn}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <button
                          onClick={() => {
                            setEditCategory(cat);
                            setNewPlannedValue(cat.planned.toString());
                          }}
                          className="px-2.5 py-1 text-[10px] font-black bg-[#0F4C81]/10 text-[#0F4C81] border border-[#0F4C81]/15 rounded-lg hover:bg-[#0F4C81]/25 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          تعديل التخطيط
                        </button>
                      </div>
                    </div>

                    {/* Numeric tracking row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100/50">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">الموازنة المقدرة</span>
                        <span className="text-xs font-black text-slate-800 font-mono">{cat.planned.toLocaleString()} ج.م</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">المنصرف الفعلي</span>
                        <span className="text-xs font-black text-slate-800 font-mono">{cat.actual.toLocaleString()} ج.م</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">الانحراف (Planned - Actual)</span>
                        <span className={`text-xs font-black font-mono flex items-center gap-1 ${
                          variance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {variance.toLocaleString()} ج.م
                          {variance >= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">كفاءة الاستهلاك (%)</span>
                        <span className={`text-xs font-black font-mono ${
                          isOverBudget ? 'text-rose-600' : 'text-slate-800'
                        }`}>
                          {utilRate}%
                        </span>
                      </div>
                    </div>

                    {/* Linear progress bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOverBudget ? 'bg-rose-500' : 'bg-[#0F4C81]'
                          }`}
                          style={{ width: `${Math.min(utilRate, 100)}%` }}
                        />
                      </div>
                      {isOverBudget && (
                        <span className="text-[9px] text-rose-500 font-bold flex items-center gap-1 pt-0.5">
                          <AlertCircle className="w-3 h-3" />
                          <span>تحذير: لقد تجاوزت هذا البند المخصص للمشروع بمقدار {(cat.actual - cat.planned).toLocaleString()} ج.م!</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Edit category planned budget modal/overlay if selected */}
            <AnimatePresence>
              {editCategory && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-5 bg-[#0F4C81]/5 border border-[#0F4C81]/15 rounded-2xl space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-black text-slate-800">
                      تعديل الموازنة المخططة لبند: {editCategory.nameAr}
                    </span>
                    <button 
                      onClick={() => setEditCategory(null)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      إلغاء ×
                    </button>
                  </div>

                  <form onSubmit={handleUpdatePlannedCategoryBudget} className="flex flex-col sm:flex-row items-end gap-3">
                    <div className="flex-1 w-full">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">المبلغ المخطط الجديد (ج.م)</label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          value={newPlannedValue}
                          onChange={(e) => setNewPlannedValue(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono font-bold">ج.م</span>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        type="submit"
                        className="flex-1 sm:flex-none px-4 py-2 bg-[#0F4C81] text-white text-xs font-bold rounded-xl hover:bg-[#0c3d67] transition-all cursor-pointer whitespace-nowrap"
                      >
                        حفظ التعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditCategory(null)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Expense Logging / Transaction Entry */}
          <div className="bg-white/45 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <span className="p-1 bg-[#F7941D]/10 rounded">
                    <Plus className="w-4 h-4 text-[#F7941D]" />
                  </span>
                  <span>تسجيل وتقييد دفعة منصرفة فعلية (Log Direct Expense)</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-bold">
                  يسجل هذا الإدخال مصروفًا فعليًا ويدمجه مباشرة في ميزانيات موديول مراكز التكلفة ERP.
                </p>
              </div>
            </div>

            <form onSubmit={handleLogExpense} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Category selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5">بند الموازنة المستهدف</label>
                <select
                  value={logCategory}
                  onChange={(e) => setLogCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent h-[38px]"
                >
                  {selectedAllocation?.categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nameAr}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5">قيمة المبالغ المنصرفة (ج.م)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    placeholder="مثال: 12500"
                    value={logAmount}
                    onChange={(e) => setLogAmount(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F4C81] h-[38px]"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono font-bold">ج.م</span>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5">تاريخ المعاملة الميدانية</label>
                <input
                  type="date"
                  required
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F4C81] h-[38px]"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5">بيان تفصيلي لسبب الصرف والمستلم</label>
                <input
                  type="text"
                  placeholder="مثال: فاتورة توريد ديزل طوارئ تشغيل أوناش ديمباج بموقع بورسعيد"
                  value={logDescription}
                  onChange={(e) => setLogDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F4C81] h-[38px]"
                />
              </div>

              {/* Submit button */}
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={!selectedProjectId || selectedProjectId === 'all'}
                  className="w-full py-2 px-4 bg-[#0F4C81] hover:bg-[#0c3d67] disabled:bg-slate-200 text-white font-extrabold text-xs rounded-xl transition-all duration-200 shadow-sm cursor-pointer disabled:cursor-not-allowed h-[38px] flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> تقييد وترحيل المعاملة
                </button>
              </div>

            </form>
          </div>

        </div>

      </div>

      {/* Visual analytics dashboard row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: Project-wide budget comparison (Planned vs Actual) */}
        <div className="bg-white/45 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-800">مخطط الموازنات المخططة مقابل المنصرف الفعلي</h3>
              <p className="text-[10px] text-slate-400 font-bold">مقارنة بصرية شاملة عبر كافة المشاريع والأقسام</p>
            </div>
            <span className="text-[10px] bg-[#0F4C81]/10 text-[#0F4C81] px-2 py-0.5 rounded font-black">تحليل إجمالي</span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={9} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={9} tickLine={false} tickFormatter={(v) => `${(v / 1000).toLocaleString()}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #E2E8F0', direction: 'rtl', textAlign: 'right' }}
                  formatter={(value: any, name: any) => {
                    const label = name === 'planned' ? 'المخطط التقديري' : 'المنصرف الحقيقي';
                    return [`${Number(value).toLocaleString()} ج.م`, label];
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Bar name="planned" dataKey="planned" fill="#94A3B8" opacity={0.3} radius={[4, 4, 0, 0]} barSize={16} />
                <Bar name="actual" dataKey="actual" fill="#0F4C81" radius={[4, 4, 0, 0]} barSize={16}>
                  {projectsChartData.map((entry, index) => {
                    const isSelected = entry.id === selectedProjectId;
                    const isOver = entry.actual > entry.planned;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={isOver ? '#EF4444' : isSelected ? '#F7941D' : '#0F4C81'}
                        opacity={isSelected ? 1 : 0.8}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Variance analysis for the selected project */}
        <div className="bg-white/45 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-800">تحليل انحراف بنود المشروع المحدد</h3>
              <p className="text-[10px] text-slate-400 font-bold">
                {selectedProject ? `مستوى تباين الفئات لـ: ${selectedProject.nameAr}` : 'برجاء اختيار مشروع من القائمة الجانبية'}
              </p>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-black">تحليل الانحراف</span>
          </div>

          {selectedProjectId && selectedProjectId !== 'all' ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={categoryBreakdownChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={8} tickFormatter={(val) => val.length > 15 ? val.substring(0, 13) + '..' : val} tickLine={false} />
                  <YAxis stroke="#6B7280" fontSize={9} tickLine={false} tickFormatter={(v) => `${(v / 1000).toLocaleString()}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #E2E8F0', direction: 'rtl', textAlign: 'right' }}
                    formatter={(value: any, name: any) => {
                      const labels: any = { planned: 'مخطط', actual: 'فعلي', variance: 'وفر الانحراف' };
                      return [`${Number(value).toLocaleString()} ج.م`, labels[name] || name];
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Bar name="planned" dataKey="planned" fill="#94A3B8" opacity={0.3} radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar name="actual" dataKey="actual" fill="#F7941D" radius={[4, 4, 0, 0]} barSize={12} />
                  <Line type="monotone" name="variance" dataKey="variance" stroke="#10B981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px] w-full flex flex-col items-center justify-center text-slate-400 gap-2">
              <FileSpreadsheet className="w-10 h-10 text-slate-300" />
              <span className="text-xs font-bold">برجاء تحديد مشروع من القائمة الجانبية لعرض تحليل الانحراف لبنوده</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
