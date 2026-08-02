import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Clock, CheckCircle2, AlertTriangle, Play, Plus, 
  MapPin, User, ChevronLeft, ChevronRight, BarChart3, Trash2, 
  Settings, RefreshCw, Layers, ShieldCheck, Flag, Check, X
} from 'lucide-react';
import { Contract, Crane, ProjectMilestone, ProjectTimelineData } from '../types';

interface ContractTimelineProps {
  contracts: Contract[];
  cranes: Crane[];
}

const RANGE_START = new Date('2026-05-01').getTime();
const RANGE_END = new Date('2026-12-31').getTime();
const TOTAL_DURATION = RANGE_END - RANGE_START;

const MONTHS_AR = [
  { name: 'مايو ٢٠٢٦', days: 31 },
  { name: 'يونيو ٢٠٢٦', days: 30 },
  { name: 'يوليو ٢٠٢٦', days: 31 },
  { name: 'أغسطس ٢٠٢٦', days: 31 },
  { name: 'سبتمبر ٢٠٢٦', days: 30 },
  { name: 'أكتوبر ٢٠٢٦', days: 31 },
  { name: 'نوفمبر ٢٠٢٦', days: 30 },
  { name: 'ديسمبر ٢٠٢٦', days: 31 },
];

export default function ContractTimeline({ contracts, cranes }: ContractTimelineProps) {
  // Master timeline state mapping contractId -> ProjectTimelineData
  const [timelineMap, setTimelineMap] = useState<Record<string, ProjectTimelineData>>({
    'cnt1': {
      contractId: 'cnt1',
      projectName: 'المقاولون العرب - مشروع مركز مصر الثقافي الإسلامي',
      manager: 'مهندس شريف فاروق',
      location: 'ساحة الشعب - العاصمة الإدارية الجديدة',
      progress: 60,
      milestones: [
        { id: 'cnt1-m1', title: 'نقل ونصب الونش ديمباج بالموقع العاصمة الإدارية', dueDate: '2026-06-05', status: 'completed' },
        { id: 'cnt1-m2', title: 'المعايرة الفنية واختبار سقف الأحمال الاستاتيكية', dueDate: '2026-06-12', status: 'completed' },
        { id: 'cnt1-m3', title: 'تنفيذ أعمال رفع صلب المنبر والقباب الكبرى', dueDate: '2026-07-20', status: 'in_progress' },
        { id: 'cnt1-m4', title: 'المراجعة ربع السنوية واختبار سلامة الوصلات التلسكوبية', dueDate: '2026-08-15', status: 'upcoming' },
        { id: 'cnt1-m5', title: 'فك الرافعة الكلي وإخلاء ساحة الموقع للتسليم النهائي', dueDate: '2026-08-30', status: 'upcoming' }
      ]
    },
    'cnt2': {
      contractId: 'cnt2',
      projectName: 'هيئة ميناء الإسكندرية - أرصفة الحاويات الجديدة',
      manager: 'مهندس مدحت عبد الهادي',
      location: 'محطة متعددة الأغراض - رصيف ٥٥ بميناء الإسكندرية',
      progress: 35,
      milestones: [
        { id: 'cnt2-m1', title: 'تجهيز وتفويض السائق المعتمد والمشرف الفني للوردية', dueDate: '2026-05-18', status: 'completed' },
        { id: 'cnt2-m2', title: 'الوصول لساحة الميناء وتثبيت كاميرات التتبع والـ GPS المحدث', dueDate: '2026-05-24', status: 'completed' },
        { id: 'cnt2-m3', title: 'دخول الونش الخدمة وبدء تفريغ حاويات المعدات برصيف ٥٥', dueDate: '2026-07-02', status: 'in_progress' },
        { id: 'cnt2-m4', title: 'الفحص الدوري الهيدروليكي الثاني ومراجعة زيت ناقل الحركة', dueDate: '2026-09-10', status: 'upcoming' },
        { id: 'cnt2-m5', title: 'إنهاء عمليات شحن وتثبيت رصيف الحاويات وتسليم رخصة التشغيل', dueDate: '2026-11-12', status: 'upcoming' }
      ]
    },
    'cnt3': {
      contractId: 'cnt3',
      projectName: 'بتروجيت للخدمات البترولية والمستودعات',
      manager: 'مهندس تامر مصطفى',
      location: 'مجمع المستودعات البترولية - العين السخنة',
      progress: 100,
      milestones: [
        { id: 'cnt3-m1', title: 'الدراسة الهندسية المسبقة لتوزيع ثقل الرافعات والتربة', dueDate: '2026-02-05', status: 'completed' },
        { id: 'cnt3-m2', title: 'تثبيت كابلات الاتزان الجانبي والجر للرافعة الثقيلة تيريكس', dueDate: '2026-02-12', status: 'completed' },
        { id: 'cnt3-m3', title: 'رفع وتركيب خزانات الضغط العملاقة في مجمع البترول', dueDate: '2026-04-10', status: 'completed' },
        { id: 'cnt3-m4', title: 'التسليم الفني النهائي وحصول بتروجيت على شهادة الفحص الموثقة', dueDate: '2026-05-28', status: 'completed' }
      ]
    }
  });

  const [selectedContractId, setSelectedContractId] = useState<string>('cnt1');
  const [showAddMilestone, setShowAddMilestone] = useState(false);

  // New milestone form states
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newStatus, setNewStatus] = useState<ProjectMilestone['status']>('upcoming');

  // Sync contracts into timeline data (reactive mapping for newly created contracts)
  useEffect(() => {
    let changed = false;
    const updated = { ...timelineMap };

    contracts.forEach(c => {
      if (!updated[c.id]) {
        updated[c.id] = {
          contractId: c.id,
          projectName: c.customerName,
          manager: 'مهندس الموقع المعين',
          location: 'موقع الإنشاء المعتمد بالعقد المبرم',
          progress: c.status === 'completed' ? 100 : 20,
          milestones: [
            { id: `${c.id}-m1`, title: 'بدء نقل وتجهيز الرافعة هيدروليكياً وتفويض الطاقم', dueDate: c.startDate, status: 'completed' },
            { id: `${c.id}-m2`, title: 'الفحص الفني بموقع العمل وإصدار تصريح التموضع الآمن', dueDate: c.startDate, status: 'in_progress' },
            { id: `${c.id}-m3`, title: 'التسليم التجاري النهائي للمرحلة الإنشائية وفك المعدة', dueDate: c.endDate, status: 'upcoming' }
          ]
        };
        changed = true;
      }
    });

    if (changed) {
      setTimelineMap(updated);
    }
  }, [contracts]);

  // Selected project details derived from map
  const activeTimeline = useMemo(() => {
    return timelineMap[selectedContractId] || Object.values(timelineMap)[0] || null;
  }, [timelineMap, selectedContractId]);

  // Selected contract details derived from parent prop
  const activeContract = useMemo(() => {
    return contracts.find(c => c.id === selectedContractId) || contracts[0] || null;
  }, [contracts, selectedContractId]);

  // Helper to map calendar date to percentage
  const getGanttPosition = (startStr: string, endStr: string) => {
    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();

    // clamp values to within RANGE_START and RANGE_END
    const clampedStart = Math.max(RANGE_START, Math.min(RANGE_END, start));
    const clampedEnd = Math.max(RANGE_START, Math.min(RANGE_END, end));

    const leftPercent = ((clampedStart - RANGE_START) / TOTAL_DURATION) * 100;
    const widthPercent = ((clampedEnd - clampedStart) / TOTAL_DURATION) * 100;

    return {
      left: `${Math.max(0, Math.min(98, leftPercent))}%`,
      width: `${Math.max(4, Math.min(100, widthPercent))}%`
    };
  };

  // Helper to get milestone dot position relative to range
  const getMilestonePosition = (dateStr: string) => {
    const dateVal = new Date(dateStr).getTime();
    const clampedDate = Math.max(RANGE_START, Math.min(RANGE_END, dateVal));
    const percent = ((clampedDate - RANGE_START) / TOTAL_DURATION) * 100;
    return `${Math.max(0, Math.min(98, percent))}%`;
  };

  // Trigger updating a single milestone's status
  const handleToggleMilestone = (milestoneId: string, status: ProjectMilestone['status']) => {
    if (!activeTimeline) return;

    const updatedMilestones = activeTimeline.milestones.map(m => {
      if (m.id === milestoneId) {
        return { ...m, status };
      }
      return m;
    });

    // Auto-calculate new progress based on milestones
    const completedCount = updatedMilestones.filter(m => m.status === 'completed').length;
    const calculatedProgress = Math.round((completedCount / updatedMilestones.length) * 100);

    setTimelineMap({
      ...timelineMap,
      [selectedContractId]: {
        ...activeTimeline,
        progress: calculatedProgress,
        milestones: updatedMilestones
      }
    });
  };

  // Add a brand-new custom milestone
  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTimeline || !newTitle || !newDueDate) return;

    const newMilestone: ProjectMilestone = {
      id: `${selectedContractId}-m-${Date.now()}`,
      title: newTitle,
      dueDate: newDueDate,
      status: newStatus
    };

    const updatedMilestones = [...activeTimeline.milestones, newMilestone].sort((a,b) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    // Recalculate progress
    const completedCount = updatedMilestones.filter(m => m.status === 'completed').length;
    const calculatedProgress = Math.round((completedCount / updatedMilestones.length) * 100);

    setTimelineMap({
      ...timelineMap,
      [selectedContractId]: {
        ...activeTimeline,
        progress: calculatedProgress,
        milestones: updatedMilestones
      }
    });

    // Reset Form
    setNewTitle('');
    setNewDueDate('');
    setNewStatus('upcoming');
    setShowAddMilestone(false);
  };

  // Delete a milestone
  const handleDeleteMilestone = (milestoneId: string) => {
    if (!activeTimeline) return;
    if (activeTimeline.milestones.length <= 1) {
      alert('لا يمكن حذف كل معالم المشروع. يجب الإبقاء على معلم واحد على الأقل للمتابعة.');
      return;
    }

    const updatedMilestones = activeTimeline.milestones.filter(m => m.id !== milestoneId);
    
    // Recalculate progress
    const completedCount = updatedMilestones.filter(m => m.status === 'completed').length;
    const calculatedProgress = Math.round((completedCount / updatedMilestones.length) * 100);

    setTimelineMap({
      ...timelineMap,
      [selectedContractId]: {
        ...activeTimeline,
        progress: calculatedProgress,
        milestones: updatedMilestones
      }
    });
  };

  // Quick progress adjustment
  const handleProgressSliderChange = (newVal: number) => {
    if (!activeTimeline) return;
    setTimelineMap({
      ...timelineMap,
      [selectedContractId]: {
        ...activeTimeline,
        progress: newVal
      }
    });
  };

  // Helper colors for status
  const getStatusColor = (status: ProjectMilestone['status']) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500 text-white border-emerald-600';
      case 'in_progress': return 'bg-blue-500 text-white border-blue-600 animate-pulse';
      case 'delayed': return 'bg-rose-500 text-white border-rose-600';
      default: return 'bg-slate-200 text-slate-700 border-slate-300';
    }
  };

  const getStatusLabel = (status: ProjectMilestone['status']) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'in_progress': return 'قيد التنفيذ';
      case 'delayed': return 'متأخر';
      default: return 'مخطط له';
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Overview stats specific to timeline module */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white/50 backdrop-blur-md border border-white p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">إجمالي مشروعات المخطط</span>
            <p className="text-xl font-black text-[#0F4C81]">{contracts.length} مشاريع مبرمة</p>
            <span className="text-[9px] text-slate-500 font-bold bg-slate-100 border px-2 py-0.5 rounded-full inline-block">
              تكامل مباشر مع العقود
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-[#0F4C81] rounded-2xl border border-blue-100">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/50 backdrop-blur-md border border-white p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">المعالم الكلية المتتبعة</span>
            <p className="text-xl font-black text-amber-600">
              {(Object.values(timelineMap) as ProjectTimelineData[]).reduce((sum, t) => sum + t.milestones.length, 0)} معلماً رئيسياً
            </p>
            <span className="text-[9px] text-amber-600 font-bold bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full inline-block">
              تحديث وحفظ تفاعلي
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <Flag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/50 backdrop-blur-md border border-white p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">الامتثال للجدول الزمني</span>
            <p className="text-xl font-black text-emerald-600">٩١.٨٪ توافق</p>
            <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full inline-block">
              بموجب الفحص الفني
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Gantt and Details Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Gantt-style Calendar Map (Left - 2 Columns) */}
        <div className="xl:col-span-2 bg-white/50 backdrop-blur-md border border-white shadow-xs rounded-2xl p-5 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">مخطط غانت الزمني لعقود التشغيل (Gantt Chart 2026)</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">انقر على شريط أي مشروع لعرض معالمه، تفاصيله، أو التحكم الإداري به.</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
              <span className="w-2.5 h-2.5 rounded bg-[#0F4C81] inline-block" />
              <span>نشط</span>
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block mr-2" />
              <span>مكتمل</span>
            </div>
          </div>

          {/* Gantt Viewport Container */}
          <div className="space-y-4">
            
            {/* Calendar Months Header Grid */}
            <div className="grid grid-cols-8 border-b border-slate-200/60 pb-2 text-center text-[10px] font-black text-slate-500">
              {MONTHS_AR.map((m, idx) => (
                <div key={idx} className="border-r border-slate-100/50 last:border-r-0 pb-1 font-sans">
                  {m.name}
                </div>
              ))}
            </div>

            {/* Gantt Rows for Each Contract */}
            <div className="space-y-5 relative pt-2">
              
              {/* Background Vertical Gridlines for the 8 columns */}
              <div className="absolute inset-0 grid grid-cols-8 pointer-events-none" style={{ height: 'calc(100% + 10px)' }}>
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="border-r border-slate-100/80 h-full last:border-r-0" />
                ))}
              </div>

              {/* Dynamic Rows */}
              {contracts.map(contract => {
                const isSelected = selectedContractId === contract.id;
                const timeline = timelineMap[contract.id] || { progress: 0, milestones: [] };
                const barPos = getGanttPosition(contract.startDate, contract.endDate);

                return (
                  <div 
                    key={contract.id} 
                    onClick={() => setSelectedContractId(contract.id)}
                    className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-slate-50/90 border-[#0F4C81] shadow-xs' 
                        : 'bg-white/30 border-slate-200/40 hover:bg-white/60 hover:border-slate-300'
                    }`}
                  >
                    {/* Project metadata */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3.5 relative z-10">
                      <div>
                        <span className="text-[10px] font-mono text-[#0F4C81] font-extrabold bg-[#0F4C81]/5 px-2 py-0.5 rounded-md">
                          {contract.contractNo}
                        </span>
                        <h4 className="font-black text-slate-800 text-xs mt-1 block">
                          {contract.customerName}
                        </h4>
                        <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                          الرافعة المخصصة: {contract.craneName} • القيمة: {contract.value.toLocaleString()} ج.م
                        </span>
                      </div>

                      <div className="text-left">
                        <span className="text-[11px] font-black text-slate-700 block font-mono">
                          {timeline.progress}% الإنجاز
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold block">
                          {contract.startDate} إلى {contract.endDate}
                        </span>
                      </div>
                    </div>

                    {/* Gantt Bar Lane */}
                    <div className="relative h-7 bg-slate-100/80 rounded-lg overflow-visible border border-slate-200/20">
                      
                      {/* Active Span Gantt Bar */}
                      <div 
                        className="absolute h-full top-0 rounded-lg flex items-center transition-all duration-300 shadow-3xs"
                        style={{ 
                          left: barPos.left, 
                          width: barPos.width,
                          backgroundColor: contract.status === 'completed' ? '#10b981' : '#0F4C81'
                        }}
                      >
                        {/* Glowing progress slider inside the Gantt span */}
                        <div 
                          className="h-full rounded-r-lg bg-white/20 transition-all duration-300 relative overflow-hidden"
                          style={{ width: `${timeline.progress}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                        </div>

                        {/* Internal Label if width is large enough */}
                        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white px-2 truncate pointer-events-none">
                          {timeline.progress}% منجز ({contract.status === 'completed' ? 'تم الفك والاسترجاع' : 'قيد التشغيل بالموقع'})
                        </span>
                      </div>

                      {/* Overlaid Milestones Deadlines Pins */}
                      {timeline.milestones.map((m, mIdx) => {
                        const pinLeft = getMilestonePosition(m.dueDate);
                        
                        return (
                          <div 
                            key={m.id} 
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group/pin z-20"
                            style={{ left: pinLeft }}
                            title={`${m.title} - ${m.dueDate} (${getStatusLabel(m.status)})`}
                          >
                            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shadow-3xs transition-transform hover:scale-135 cursor-help ${
                              m.status === 'completed' ? 'bg-emerald-500 border-white text-white' :
                              m.status === 'in_progress' ? 'bg-blue-500 border-white text-white animate-bounce' :
                              m.status === 'delayed' ? 'bg-rose-500 border-white text-white' : 'bg-slate-300 border-white text-slate-700'
                            }`}>
                              <span className="text-[7px] font-black">{mIdx + 1}</span>
                            </div>

                            {/* Tooltip on hover */}
                            <div className="absolute bottom-5 right-1/2 translate-x-1/2 hidden group-hover/pin:block bg-slate-900 text-white p-2 rounded-lg text-[9px] w-48 font-black leading-relaxed shadow-lg z-30">
                              <p className="border-b border-white/15 pb-1 text-amber-400 font-mono">المعلم {mIdx + 1}: {m.dueDate}</p>
                              <p className="mt-1 font-bold text-slate-100">{m.title}</p>
                              <p className="mt-0.5 text-[8px] text-slate-300">الحالة: {getStatusLabel(m.status)}</p>
                            </div>
                          </div>
                        );
                      })}

                    </div>

                    {/* Brief Milestones Summary Footer under Gantt bar */}
                    <div className="flex items-center gap-3 mt-2 text-[9px] text-slate-400 font-bold overflow-hidden">
                      <span className="text-[9px] text-[#0F4C81] font-black shrink-0">المعالم الرئيسية:</span>
                      <div className="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
                        {timeline.milestones.map((m, idx) => (
                          <span key={m.id} className="inline-flex items-center gap-1 bg-white border px-1.5 py-0.5 rounded">
                            <span className={`w-1 h-1 rounded-full ${
                              m.status === 'completed' ? 'bg-emerald-500' :
                              m.status === 'in_progress' ? 'bg-blue-500' :
                              m.status === 'delayed' ? 'bg-rose-500' : 'bg-slate-300'
                            }`} />
                            <span>({idx+1}) {m.dueDate}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>
                );
              })}

            </div>

          </div>

          {/* Simulation & ERP Controls */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-[#0F4C81]" />
              <span>لوحة التحكم في محاكاة تقدم الجدول الزمني للموقع</span>
            </h4>
            
            <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
              بصفتك مدير العمليات في شركة مصر للأوناش، يمكنك تحريك شريط التمرير أدناه لتعديل نسبة الإنجاز الإجمالية للمشروع المختار حالياً يدوياً، أو استخدام قسم المعالم باليسار لإكمال المهام الفردية وسيتم تحديث شريط غانت ونقاط المعالم حياً ومباشرة.
            </p>

            {activeTimeline && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-200/50">
                <div className="w-full sm:w-2/3 space-y-1">
                  <div className="flex justify-between text-[11px] font-black text-slate-700">
                    <span>تعديل نسبة الإنجاز للمشروع المختار:</span>
                    <span className="font-mono text-[#0F4C81]">{activeTimeline.progress}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={activeTimeline.progress} 
                    onChange={e => handleProgressSliderChange(parseInt(e.target.value))}
                    className="w-full accent-[#0F4C81] h-1.5 bg-slate-200 rounded-lg cursor-ew-resize"
                  />
                </div>

                <button
                  onClick={() => {
                    // Set all milestones in active timeline to completed
                    if (!activeTimeline) return;
                    const completedAll = activeTimeline.milestones.map(m => ({ ...m, status: 'completed' as const }));
                    setTimelineMap({
                      ...timelineMap,
                      [selectedContractId]: {
                        ...activeTimeline,
                        progress: 100,
                        milestones: completedAll
                      }
                    });
                  }}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg shadow-sm transition-colors cursor-pointer w-full sm:w-auto text-center"
                >
                  اعتماد إنجاز كافة المعالم (100%)
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Selected Project Milestone & Deadlines Panel (Right - 1 Column) */}
        <div className="space-y-6">
          
          {/* Active Project Card Details */}
          {activeTimeline && activeContract && (
            <div className="bg-white/50 backdrop-blur-md border border-white shadow-xs rounded-2xl p-5 space-y-4">
              
              {/* Card Header */}
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] bg-blue-50 border border-blue-200 text-[#0F4C81] px-2.5 py-0.5 rounded-full font-black">
                  معلومات ومتابعة العقد المختار
                </span>
                <h4 className="text-xs font-black text-slate-800 mt-2">{activeContract.customerName}</h4>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">رقم العقد: {activeContract.contractNo} • مخصص لرافعة {activeContract.craneName}</p>
              </div>

              {/* Manager & Location Grid */}
              <div className="grid grid-cols-2 gap-3.5 text-xs">
                <div className="bg-white/80 p-3 rounded-xl border border-slate-200/20">
                  <div className="flex items-center gap-1.5 text-slate-400 font-extrabold text-[10px] mb-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>مدير الموقع (المشرف)</span>
                  </div>
                  <p className="font-black text-slate-700 text-[11px]">{activeTimeline.manager}</p>
                </div>

                <div className="bg-white/80 p-3 rounded-xl border border-slate-200/20">
                  <div className="flex items-center gap-1.5 text-slate-400 font-extrabold text-[10px] mb-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>التموضع الجغرافي</span>
                  </div>
                  <p className="font-bold text-slate-700 text-[11px] truncate" title={activeTimeline.location}>{activeTimeline.location}</p>
                </div>
              </div>

              {/* Vertical Milestones Timeline Ledger */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-800">تتبع معالم وديدلاين المشروع ({activeTimeline.milestones.length})</h4>
                  <button
                    onClick={() => setShowAddMilestone(true)}
                    className="p-1 hover:bg-[#0F4C81]/5 text-[#0F4C81] rounded-lg transition-colors flex items-center gap-1 text-[10px] font-black cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>أضف معلماً</span>
                  </button>
                </div>

                {/* Milestone Form Overlay */}
                {showAddMilestone && (
                  <motion.form 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleAddMilestone}
                    className="bg-slate-50 border border-slate-200/50 p-3.5 rounded-xl space-y-2.5 text-xs text-right"
                  >
                    <div className="flex justify-between items-center border-b border-slate-200/30 pb-1.5">
                      <span className="font-black text-[10px] text-slate-700">إضافة معلم وجدول زمني جديد</span>
                      <button 
                        type="button" 
                        onClick={() => setShowAddMilestone(false)}
                        className="p-0.5 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-500 font-bold mb-1">عنوان المعلم الفني *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="مثال: الفحص الفني للذراع وصمام الاتزان"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        className="w-full p-2 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F4C81]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-slate-500 font-bold mb-1">تاريخ الاستحقاق *</label>
                        <input 
                          type="date" 
                          required 
                          value={newDueDate}
                          onChange={e => setNewDueDate(e.target.value)}
                          className="w-full p-2 border border-slate-200 bg-white rounded-lg text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F4C81]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-500 font-bold mb-1">الحالة البدئية</label>
                        <select
                          value={newStatus}
                          onChange={e => setNewStatus(e.target.value as any)}
                          className="w-full p-2 border border-slate-200 bg-white rounded-lg text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F4C81]"
                        >
                          <option value="upcoming">مخطط له (Upcoming)</option>
                          <option value="in_progress">قيد التشغيل (In Progress)</option>
                          <option value="completed">مكتمل (Completed)</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-1.5 bg-[#0F4C81] hover:bg-[#0c3d67] text-white font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer"
                    >
                      حقن وجدول المعلم بالـ ERP
                    </button>
                  </motion.form>
                )}

                {/* Milestones Vertical List */}
                <div className="space-y-3 relative pr-3.5 border-r border-slate-200/80">
                  {activeTimeline.milestones.map((m, idx) => (
                    <div key={m.id} className="relative group/mitem">
                      
                      {/* Timeline dot */}
                      <span className={`absolute -right-[20.5px] top-1.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center z-10 ${
                        m.status === 'completed' ? 'bg-emerald-500 border-white text-white' :
                        m.status === 'in_progress' ? 'bg-blue-500 border-white text-white animate-pulse' :
                        m.status === 'delayed' ? 'bg-rose-500 border-white text-white' : 'bg-slate-200 border-white text-slate-500'
                      }`}>
                        {m.status === 'completed' && <Check className="w-2 h-2 text-white stroke-[4]" />}
                      </span>

                      {/* Milestone content block */}
                      <div className="bg-white/80 p-3 rounded-xl border border-slate-200/30 space-y-2 text-xs">
                        <div className="flex justify-between items-start gap-2">
                          <h5 className="font-black text-slate-800 text-[11px] leading-relaxed">
                            {idx + 1}. {m.title}
                          </h5>
                          
                          <button
                            onClick={() => handleDeleteMilestone(m.id)}
                            className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded-lg opacity-0 group-hover/mitem:opacity-100 transition-all shrink-0 cursor-pointer"
                            title="حذف هذا المعلم"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Due date and quick actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] pt-1.5 border-t border-slate-100">
                          <span className="text-slate-400 font-bold font-mono flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-300" />
                            <span>تاريخ الاستحقاق: {m.dueDate}</span>
                          </span>

                          {/* Action Selector to toggle milestone status */}
                          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/40">
                            <button
                              onClick={() => handleToggleMilestone(m.id, 'completed')}
                              className={`px-1.5 py-0.5 rounded text-[8px] font-black transition-colors cursor-pointer ${m.status === 'completed' ? 'bg-emerald-600 text-white shadow-3xs' : 'text-slate-400 hover:bg-white'}`}
                              title="تحديد كمكتمل"
                            >
                              مكتمل
                            </button>
                            <button
                              onClick={() => handleToggleMilestone(m.id, 'in_progress')}
                              className={`px-1.5 py-0.5 rounded text-[8px] font-black transition-colors cursor-pointer ${m.status === 'in_progress' ? 'bg-blue-600 text-white shadow-3xs' : 'text-slate-400 hover:bg-white'}`}
                              title="تحديد كقيد التشغيل"
                            >
                              نشط
                            </button>
                            <button
                              onClick={() => handleToggleMilestone(m.id, 'delayed')}
                              className={`px-1.5 py-0.5 rounded text-[8px] font-black transition-colors cursor-pointer ${m.status === 'delayed' ? 'bg-rose-600 text-white shadow-3xs' : 'text-slate-400 hover:bg-white'}`}
                              title="تحديد كمتأخر"
                            >
                              متأخر
                            </button>
                          </div>
                        </div>

                        {/* Warn if delayed */}
                        {m.status === 'delayed' && (
                          <div className="flex items-center gap-1 text-[9px] text-rose-600 bg-rose-50 px-2 py-1 rounded-md font-bold mt-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>عقوبات تأخير قد تطبق بموجب العقد لتعطيل الونش!</span>
                          </div>
                        )}
                      </div>

                    </div>
                  ))}
                </div>

              </div>

            </div>
          )}

          {!activeTimeline && (
            <div className="bg-slate-100/30 backdrop-blur-md border border-dashed border-slate-300 p-6 rounded-2xl text-center text-slate-400 font-extrabold text-xs">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
              <span>الرجاء اختيار أحد المشاريع من المخطط لفتح لوحة التحكم بالمعالم والديدلاين.</span>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
