import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Move, Eye, EyeOff, Maximize2, Minimize2, 
  RotateCcw, Save, Check, Sparkles, GripVertical, ChevronUp, ChevronDown,
  Wrench, Activity, BarChart2, Truck, AlertTriangle, ShieldCheck, Layers, Package
} from 'lucide-react';

export interface WidgetConfig {
  id: string;
  titleAr: string;
  titleEn: string;
  category: 'kpi' | 'analytics' | 'operational' | 'alerts';
  visible: boolean;
  size: 'full' | 'half' | 'third'; // full = 12 cols, half = 6 cols, third = 4 cols
  iconName: string;
  descriptionAr: string;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
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
    size: 'half',
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

interface DashboardCustomizerProps {
  widgets: WidgetConfig[];
  onSaveWidgets: (updatedWidgets: WidgetConfig[]) => void;
  onResetWidgets: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function DashboardCustomizer({
  widgets = DEFAULT_WIDGETS,
  onSaveWidgets,
  onResetWidgets,
  isOpen,
  onClose
}: DashboardCustomizerProps) {
  const [localWidgets, setLocalWidgets] = useState<WidgetConfig[]>(widgets);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  useEffect(() => {
    if (widgets && widgets.length > 0) {
      setLocalWidgets(widgets);
    }
  }, [widgets]);

  if (!isOpen) return null;

  // Toggle Visibility
  const toggleVisibility = (id: string) => {
    setLocalWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  // Change Widget Size
  const changeSize = (id: string, newSize: 'full' | 'half' | 'third') => {
    setLocalWidgets(prev => prev.map(w => w.id === id ? { ...w, size: newSize } : w));
  };

  // Move Widget Position Up/Down
  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localWidgets.length) return;

    const copy = [...localWidgets];
    const temp = copy[index];
    copy[index] = copy[newIndex];
    copy[newIndex] = temp;
    setLocalWidgets(copy);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...localWidgets];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setLocalWidgets(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Save changes
  const handleSave = () => {
    onSaveWidgets(localWidgets);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 dir-rtl text-right overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-[#0F4C81] to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                تخصيص وترتيب ودجات لوحة التحكم (Dashboard Customizer)
              </h2>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                يمكنك التكبير، الإخفاء، وسحب الودجات لإعادة ترتيب ظهورها حسب تفضيلاتك الشخصية
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* QUICK TOOLBAR & COUNTERS */}
        <div className="bg-slate-50 p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-700">
              الودجات النشطة: <strong className="text-[#0F4C81]">{localWidgets.filter(w => w.visible).length}</strong> من أصل {localWidgets.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onResetWidgets();
                setLocalWidgets(DEFAULT_WIDGETS);
              }}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
              <span>استعادة الترتيب الافتراضي</span>
            </button>
          </div>
        </div>

        {/* WIDGETS LIST & REORDER CANVAS */}
        <div className="p-4 sm:p-6 space-y-3 overflow-y-auto flex-1">
          {localWidgets.map((widget, index) => (
            <div
              key={widget.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white ${
                widget.visible 
                  ? 'border-slate-200 shadow-2xs hover:border-[#0F4C81]/40' 
                  : 'border-slate-100 bg-slate-50/70 opacity-60'
              } ${draggedIndex === index ? 'ring-2 ring-[#0F4C81] scale-[1.01]' : ''}`}
            >
              {/* Left Drag & Title Section */}
              <div className="flex items-start sm:items-center gap-3">
                
                {/* Drag Handle & Up/Down Arrows */}
                <div className="flex items-center gap-1 text-slate-400 hover:text-slate-600">
                  <div className="cursor-grab active:cursor-grabbing p-1" title="اسحب لإعادة الترتيب">
                    <GripVertical className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <button
                      disabled={index === 0}
                      onClick={() => moveWidget(index, 'up')}
                      className="p-0.5 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-20 cursor-pointer"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={index === localWidgets.length - 1}
                      onClick={() => moveWidget(index, 'down')}
                      className="p-0.5 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-20 cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-slate-400">#{index + 1}</span>
                    <h4 className="text-xs font-black text-slate-900">{widget.titleAr}</h4>
                    {!widget.visible && (
                      <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        مخفي
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{widget.descriptionAr}</p>
                </div>
              </div>

              {/* Controls: Size & Visibility Toggle */}
              <div className="flex items-center gap-2 self-end sm:self-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                
                {/* Size Selector */}
                <div className="bg-slate-100 p-1 rounded-lg flex items-center text-[10px] font-extrabold text-slate-600">
                  <button
                    onClick={() => changeSize(widget.id, 'full')}
                    className={`px-2 py-1 rounded transition-all cursor-pointer ${
                      widget.size === 'full' ? 'bg-[#0F4C81] text-white shadow-2xs' : 'hover:text-slate-900'
                    }`}
                    title="عرض كامل الشاشة (12 عمود)"
                  >
                    عرض كامل (Full)
                  </button>
                  <button
                    onClick={() => changeSize(widget.id, 'half')}
                    className={`px-2 py-1 rounded transition-all cursor-pointer ${
                      widget.size === 'half' ? 'bg-[#0F4C81] text-white shadow-2xs' : 'hover:text-slate-900'
                    }`}
                    title="عرض نصف الشاشة (6 أعمدة)"
                  >
                    نصف (Half)
                  </button>
                </div>

                {/* Show/Hide Toggle Button */}
                <button
                  onClick={() => toggleVisibility(widget.id)}
                  className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    widget.visible 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {widget.visible ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                  <span>{widget.visible ? 'ظاهر' : 'إظهار'}</span>
                </button>

              </div>
            </div>
          ))}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            يتم حفظ إعدادات المظهر تلقائياً لملفك الشخصي
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              إلغاء
            </button>

            <button
              onClick={handleSave}
              className="px-5 py-2 bg-[#0F4C81] hover:bg-[#0c3d67] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              {savedNotice ? <Check className="w-4 h-4 text-emerald-300 animate-bounce" /> : <Save className="w-4 h-4" />}
              <span>{savedNotice ? 'تم حفظ التفضيلات!' : 'حفظ الترتيب والتخصيص'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
