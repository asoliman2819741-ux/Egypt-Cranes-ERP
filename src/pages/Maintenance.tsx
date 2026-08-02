import React, { useState } from 'react';
import { MaintenanceOrder, Crane, LubricationTask, SparePartsRequest, InventoryItem, AssetMaintenanceBudget } from '../types';
import { initialMaintenanceOrders, initialAssetBudgets } from '../mockData';
import { Plus, Search, Wrench, Calendar, DollarSign, PenTool, CheckCircle, CheckCircle2, Clock, Eye, Trash2, Brain, Bell, BarChart2, Camera, AlertTriangle, Droplets, Package, Check, X, ShieldCheck, Edit3 } from 'lucide-react';
import PredictiveMaintenance from '../components/PredictiveMaintenance';
import MaintenanceNotifications from '../components/MaintenanceNotifications';
import MaintenanceDashboard from '../components/MaintenanceDashboard';
import FaultCameraCapture from '../components/FaultCameraCapture';

interface MaintenanceProps {
  cranes: Crane[];
  onCraneMaintenanceSuccess: (craneId: string) => void;
  onUpdateCraneStatus?: (craneId: string, status: 'running' | 'idle' | 'maintenance') => void;
  lubrications?: LubricationTask[];
  onUpdateLubrication?: (id: string, updatedFields: Partial<LubricationTask>) => void;
  onAddLubrication?: (newLub: LubricationTask) => void;
  sparePartsRequests?: SparePartsRequest[];
  onAddSparePartsRequest?: (newReq: SparePartsRequest) => void;
  onApproveSparePartsRequest?: (id: string) => void;
  inventoryItems?: InventoryItem[];
  tasks?: any[];
  onAddTask?: (task: any) => void;
  onUpdateTask?: (id: string, updated: any) => void;
  assetBudgets?: AssetMaintenanceBudget[];
  onUpdateAssetBudget?: (id: string, updated: Partial<AssetMaintenanceBudget>) => void;
  onAddAssetBudget?: (newBudget: AssetMaintenanceBudget) => void;
}

export default function Maintenance({
  cranes,
  onCraneMaintenanceSuccess,
  onUpdateCraneStatus,
  lubrications = [],
  onUpdateLubrication,
  onAddLubrication,
  sparePartsRequests = [],
  onAddSparePartsRequest,
  onApproveSparePartsRequest,
  inventoryItems = [],
  assetBudgets,
  onUpdateAssetBudget,
  onAddAssetBudget
}: MaintenanceProps) {
  const [orders, setOrders] = useState<MaintenanceOrder[]>(initialMaintenanceOrders);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MaintenanceOrder | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'predictive' | 'notifications' | 'dashboard' | 'lubrication' | 'spareParts' | 'assetBudgets'>('dashboard');

  // Asset Budgets State & Modals
  const [localBudgets, setLocalBudgets] = useState<AssetMaintenanceBudget[]>(assetBudgets || initialAssetBudgets);
  const budgetsList = assetBudgets || localBudgets;

  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<AssetMaintenanceBudget | null>(null);
  const [selectedBudgetDetail, setSelectedBudgetDetail] = useState<AssetMaintenanceBudget | null>(null);
  const [budgetCategoryFilter, setBudgetCategoryFilter] = useState<string>('الكل');
  const [budgetSearch, setBudgetSearch] = useState<string>('');

  // New Budget Form state
  const [newTargetType, setNewTargetType] = useState<'crane' | 'category'>('crane');
  const [newTargetId, setNewTargetId] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState<string>('أوناش تلسكوبية');
  const [newAnnualBudget, setNewAnnualBudget] = useState<string>('');
  const [newBudgetNotes, setNewBudgetNotes] = useState<string>('');

  // Edit Budget Form state
  const [editAmount, setEditAmount] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // Helper to calculate actual spent & committed costs for a given budget
  const computeBudgetMetrics = (budget: AssetMaintenanceBudget) => {
    const matchingCraneIds = cranes
      .filter(c => {
        if (budget.targetType === 'crane') return c.id === budget.targetId;
        if (budget.targetType === 'category' && budget.category) {
          if (budget.category.includes('تلسكوبي') && c.nameAr.includes('تلسكوبي')) return true;
          if (budget.category.includes('مجنزر') && (c.nameAr.includes('جنزير') || c.nameAr.includes('مجنزر'))) return true;
          if (budget.category.includes('الورشة')) return true;
        }
        return false;
      })
      .map(c => c.id);

    const matchingCraneNames = cranes
      .filter(c => matchingCraneIds.includes(c.id))
      .map(c => c.nameAr);

    // 1. Completed Orders (Actual)
    const completedOrders = orders.filter(o => {
      if (o.status !== 'completed') return false;
      if (budget.targetType === 'crane') return o.craneId === budget.targetId || (o.craneName && o.craneName.includes(budget.targetNameAr.split(' ')[0]));
      return matchingCraneIds.includes(o.craneId) || matchingCraneNames.some(cn => o.craneName && o.craneName.includes(cn.split(' ')[0]));
    });
    const actualOrderCosts = completedOrders.reduce((sum, o) => sum + (o.cost || 0), 0);

    // 2. Approved/Fulfilled Spare Parts (Actual)
    const approvedParts = sparePartsRequests.filter(r => {
      if (r.status !== 'approved' && r.status !== 'fulfilled') return false;
      if (budget.targetType === 'crane') {
        const cr = cranes.find(c => c.id === budget.targetId);
        return (cr && r.craneName && r.craneName.includes(cr.nameAr.split(' ')[0])) || (r.craneName && r.craneName.includes(budget.targetNameAr.split(' ')[0]));
      }
      return matchingCraneNames.some(cn => r.craneName && r.craneName.includes(cn.split(' ')[0]));
    });

    const actualPartsCosts = approvedParts.reduce((sum, r) => {
      if (r.totalCost) return sum + r.totalCost;
      if (r.items && r.items.length > 0) return sum + r.items.reduce((s, item) => s + (item.quantity * item.unitPrice), 0);
      return sum + ((r.quantityRequested || 1) * 1500);
    }, 0);

    const totalActualSpent = actualOrderCosts + actualPartsCosts;

    // 3. Pending/In-progress Orders (Committed)
    const pendingOrders = orders.filter(o => {
      if (o.status === 'completed') return false;
      if (budget.targetType === 'crane') return o.craneId === budget.targetId || (o.craneName && o.craneName.includes(budget.targetNameAr.split(' ')[0]));
      return matchingCraneIds.includes(o.craneId) || matchingCraneNames.some(cn => o.craneName && o.craneName.includes(cn.split(' ')[0]));
    });
    const committedOrderCosts = pendingOrders.reduce((sum, o) => sum + (o.cost || 0), 0);

    // 4. Pending Spare Parts Requests (Committed)
    const pendingParts = sparePartsRequests.filter(r => {
      if (r.status !== 'pending') return false;
      if (budget.targetType === 'crane') {
        const cr = cranes.find(c => c.id === budget.targetId);
        return (cr && r.craneName && r.craneName.includes(cr.nameAr.split(' ')[0])) || (r.craneName && r.craneName.includes(budget.targetNameAr.split(' ')[0]));
      }
      return matchingCraneNames.some(cn => r.craneName && r.craneName.includes(cn.split(' ')[0]));
    });

    const committedPartsCosts = pendingParts.reduce((sum, r) => {
      if (r.totalCost) return sum + r.totalCost;
      if (r.items && r.items.length > 0) return sum + r.items.reduce((s, item) => s + (item.quantity * item.unitPrice), 0);
      return sum + ((r.quantityRequested || 1) * 1500);
    }, 0);

    const totalCommitted = committedOrderCosts + committedPartsCosts;
    const totalUsed = totalActualSpent + totalCommitted;
    const remaining = budget.annualBudget - totalUsed;
    const utilizationPercentage = budget.annualBudget > 0 ? Math.round((totalUsed / budget.annualBudget) * 100) : 0;

    return {
      actualSpent: totalActualSpent,
      committedEstimated: totalCommitted,
      totalUsed,
      remaining,
      utilizationPercentage,
      completedOrders,
      approvedParts,
      pendingOrders,
      pendingParts
    };
  };

  const handleAddBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnualBudget || Number(newAnnualBudget) <= 0) {
      alert('يرجى إدخال قيمة ميزانية سنوية صحيحة');
      return;
    }
    let nameAr = '';
    let cat = newCategoryName;
    if (newTargetType === 'crane') {
      const cr = cranes.find(c => c.id === newTargetId);
      if (!cr) {
        alert('يرجى اختيار الرافعة المستهدفة');
        return;
      }
      nameAr = cr.nameAr;
      cat = cr.nameAr.includes('تلسكوبي') ? 'أوناش تلسكوبية' : cr.nameAr.includes('جنزير') ? 'أوناش مجنرزة' : 'أوناش أسطول';
    } else {
      nameAr = `فئة ${newCategoryName}`;
    }

    const newB: AssetMaintenanceBudget = {
      id: `amb-${Date.now()}`,
      year: 2026,
      targetType: newTargetType,
      targetId: newTargetType === 'crane' ? newTargetId : `cat-${Date.now()}`,
      targetNameAr: nameAr,
      category: cat,
      annualBudget: Number(newAnnualBudget),
      notes: newBudgetNotes
    };

    if (onAddAssetBudget) {
      onAddAssetBudget(newB);
    } else {
      setLocalBudgets(prev => [newB, ...prev]);
    }

    setShowAddBudgetModal(false);
    setNewAnnualBudget('');
    setNewBudgetNotes('');
    alert(`تم تخصيص ميزانية سنوية بمبلغ ${Number(newAnnualBudget).toLocaleString()} ريال لـ "${nameAr}" بنجاح!`);
  };

  const handleEditBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;
    const updated = {
      annualBudget: Number(editAmount) || editingBudget.annualBudget,
      notes: editNotes
    };

    if (onUpdateAssetBudget) {
      onUpdateAssetBudget(editingBudget.id, updated);
    } else {
      setLocalBudgets(prev => prev.map(b => b.id === editingBudget.id ? { ...b, ...updated } : b));
    }

    setEditingBudget(null);
    alert(`تم تحديث الميزانية المعتمدة للأصل بنجاح!`);
  };

  // Spare Parts Modal States
  const [showSparePartModal, setShowSparePartModal] = useState(false);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string>('');
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState<string>('');
  const [sparePartQty, setSparePartQty] = useState<number>(1);
  const [sparePartNotes, setSparePartNotes] = useState<string>('');

  // New Fault image states
  const [faultImage, setFaultImage] = useState<string>('');

  // Operating Hours state for cranes (pre-set close to key 250/500/1000 milestones to showcase alerts)
  const [cranesHours, setCranesHours] = useState<Record<string, number>>({
    c1: 482,  // 18 hrs to 500
    c2: 238,  // 12 hrs to 250
    c3: 741,  // 9 hrs to 750
    c4: 989,  // 11 hrs to 1000
    c5: 242   // 8 hrs to 250
  });

  // Calculate active alerts count for badge in header and tab
  const notifyThreshold = 25;
  const activeAlertsCount = Object.entries(cranesHours).filter(([id, val]) => {
    const crane = cranes.find(c => c.id === id);
    if (!crane) return false;
    const hours = Number(val);
    const milestoneInterval = 250;
    const nextMilestone = Math.ceil(hours / milestoneInterval) * milestoneInterval;
    const hoursRemaining = nextMilestone - hours;
    
    // overdue or near milestone check
    const overdueCrossed = nextMilestone - milestoneInterval;
    const isOverdue = overdueCrossed > 0 && hours - overdueCrossed < 20;
    return (hoursRemaining <= notifyThreshold && hoursRemaining >= 0) || isOverdue;
  }).length;

  // Form states
  const [orderNo, setOrderNo] = useState(`WO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`);
  const [craneId, setCraneId] = useState('');
  const [type, setType] = useState<'preventive' | 'corrective'>('preventive');
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleCreateSparePartsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventoryItemId) {
      alert('يرجى اختيار صنف قطعة الغيار من المخزون');
      return;
    }
    const invItem = inventoryItems.find(i => i.id === selectedInventoryItemId);
    const workOrder = orders.find(o => o.id === selectedWorkOrderId);
    if (!invItem) return;

    const newReq: SparePartsRequest = {
      id: `req-${Date.now()}`,
      requestNo: `SPR-${new Date().getFullYear()}-${String(sparePartsRequests.length + 1).padStart(3, '0')}`,
      maintenanceOrderId: selectedWorkOrderId || 'general',
      craneName: workOrder ? workOrder.craneName : 'عامة / صيانة ورشة',
      partItemId: invItem.id,
      partName: invItem.nameAr,
      quantityRequested: sparePartQty,
      requestedBy: 'مهندس صيانة الأوناش',
      requestDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      notes: sparePartNotes
    };

    if (onAddSparePartsRequest) {
      onAddSparePartsRequest(newReq);
    }
    setShowSparePartModal(false);
    setSelectedInventoryItemId('');
    setSparePartQty(1);
    setSparePartNotes('');
  };

  const handleSelectPredictiveOrder = (data: {
    craneId: string;
    type: 'preventive' | 'corrective';
    description: string;
    cost: number;
  }) => {
    setCraneId(data.craneId);
    setType(data.type);
    setDescription(data.description);
    setCost(String(data.cost));
    setDate(new Date().toISOString().split('T')[0]);
    setShowAddForm(true);
    setActiveTab('orders');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedCrane = cranes.find(c => c.id === craneId);
    if (!assignedCrane) {
      alert('يرجى اختيار الونش الخاضع للصيانة');
      return;
    }

    const newOrder: MaintenanceOrder = {
      id: Math.random().toString(),
      orderNo,
      craneId,
      craneName: assignedCrane.nameAr,
      type,
      cost: parseFloat(cost) || 0,
      description,
      date,
      status: 'pending',
      faultImage: faultImage || undefined
    };

    setOrders([newOrder, ...orders]);
    setShowAddForm(false);
    // Reset
    setOrderNo(`WO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`);
    setCraneId('');
    setType('preventive');
    setCost('');
    setDescription('');
    setFaultImage('');
  };

  const handleUpdateOrderImage = (orderId: string, imageBase64: string) => {
    setOrders(prevOrders => prevOrders.map(o => {
      if (o.id === orderId) {
        return { ...o, faultImage: imageBase64 };
      }
      return o;
    }));
    // Update selectedOrder reactively
    setSelectedOrder(prev => {
      if (prev && prev.id === orderId) {
        return { ...prev, faultImage: imageBase64 };
      }
      return prev;
    });
  };

  const handleClearOrderImage = (orderId: string) => {
    setOrders(prevOrders => prevOrders.map(o => {
      if (o.id === orderId) {
        const { faultImage, ...rest } = o;
        return rest;
      }
      return o;
    }));
    setSelectedOrder(prev => {
      if (prev && prev.id === orderId) {
        const { faultImage, ...rest } = prev;
        return rest;
      }
      return prev;
    });
  };

  const handleUpdateStatus = (orderId: string, newStatus: 'completed' | 'in_progress') => {
    const order = orders.find(o => o.id === orderId);
    setOrders(orders.map(o => {
      if (o.id === orderId) {
        return { ...o, status: newStatus };
      }
      return o;
    }));

    if (newStatus === 'completed' && order) {
      onCraneMaintenanceSuccess(order.craneId);
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm('هل أنت متأكد من حذف أمر الصيانة هذا؟')) {
      setOrders(orders.filter(o => o.id !== orderId));
    }
  };

  const filtered = orders.filter(o => 
    o.craneName.toLowerCase().includes(search.toLowerCase()) ||
    o.orderNo.toLowerCase().includes(search.toLowerCase()) ||
    o.description.toLowerCase().includes(search.toLowerCase())
  );

  const totalCost = orders.reduce((sum, o) => sum + o.cost, 0);
  const activeOrders = orders.filter(o => o.status === 'in_progress' || o.status === 'pending').length;

  return (
    <div className="p-6 space-y-6 dir-rtl text-right font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">سجل عمليات الصيانة والتشغيل (Work Orders)</h1>
          <p className="text-slate-500 mt-1 text-sm">إصدار أوامر الصيانة الوقائية والطارئة لضمان الكفاءة والأمان للأوناش الثقيلة</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2.5 bg-[#0F4C81] text-white font-bold text-sm rounded-xl hover:bg-[#0c3d67] transition-colors flex items-center gap-1.5 self-start"
        >
          <Plus className="w-5 h-5" /> إصدار أمر صيانة جديد
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`pb-3 px-6 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'border-[#0F4C81] text-[#0F4C81]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <BarChart2 className="w-4 h-4 text-[#0F4C81]" />
          <span>لوحة المؤشرات التفاعلية (Dashboard) 📊</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-6 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-[#0F4C81] text-[#0F4C81]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>إدارة وأوامر الصيانة الحالية</span>
        </button>
        
        <button
          type="button"
          onClick={() => setActiveTab('predictive')}
          className={`pb-3 px-6 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'predictive'
              ? 'border-[#0F4C81] text-[#0F4C81]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Brain className="w-4 h-4 text-amber-500 animate-pulse" />
          <span className="flex items-center gap-1">
            التحليل التنبؤي وتوقع الأعطال
            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-black">AI ✨</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 px-6 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'border-[#0F4C81] text-[#0F4C81]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <Bell className={`w-4.5 h-4.5 ${activeAlertsCount > 0 ? 'text-amber-500 animate-bounce' : 'text-slate-400'}`} />
            {activeAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
            )}
          </div>
          <span className="flex items-center gap-1.5">
            تنبيهات دفع ساعات التشغيل
            {activeAlertsCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                {activeAlertsCount} تنبيهات
              </span>
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lubrication')}
          className={`pb-3 px-6 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'lubrication'
              ? 'border-[#0F4C81] text-[#0F4C81]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Droplets className="w-4 h-4 text-blue-600" />
          <span>مجدول التزييت والتشحيم</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('spareParts')}
          className={`pb-3 px-6 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'spareParts'
              ? 'border-[#0F4C81] text-[#0F4C81]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Package className="w-4 h-4 text-amber-600" />
          <span className="flex items-center gap-1.5">
            طلبات قطع الغيار والصرف
            {sparePartsRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                {sparePartsRequests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assetBudgets')}
          className={`pb-3 px-6 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'assetBudgets'
              ? 'border-[#0F4C81] text-[#0F4C81]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span className="flex items-center gap-1.5">
            الميزانية السنوية للأصول
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-black">
              2026
            </span>
          </span>
        </button>
      </div>

      {activeTab === 'dashboard' ? (
        <MaintenanceDashboard
          cranes={cranes}
          orders={orders}
          onUpdateCraneStatus={onUpdateCraneStatus}
          cranesHours={cranesHours}
          onAddPredictiveOrder={handleSelectPredictiveOrder}
        />
      ) : activeTab === 'predictive' ? (
        <PredictiveMaintenance
          cranes={cranes}
          orders={orders}
          onAddPredictiveOrder={handleSelectPredictiveOrder}
        />
      ) : activeTab === 'notifications' ? (
        <MaintenanceNotifications
          cranes={cranes}
          cranesHours={cranesHours}
          setCranesHours={setCranesHours}
          onTriggerWorkOrder={handleSelectPredictiveOrder}
          orders={orders}
        />
      ) : activeTab === 'lubrication' ? (
        <div className="space-y-6">
          {/* Header & Lubrication KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold block">نقاط التزييت والتشحيم النشطة</span>
                <p className="text-xl font-black text-slate-800 mt-0.5">{lubrications.length} نقاط تشحيم</p>
                <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full inline-block mt-2">
                  لأسطول الأوناش الميدانية
                </span>
              </div>
              <div className="p-3 bg-blue-50 text-[#0F4C81] rounded-2xl">
                <Droplets className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold block">جدول التشحيم القادم</span>
                <p className="text-xl font-black text-amber-700 mt-0.5">
                  {lubrications.filter(l => l.status === 'overdue' || l.status === 'due_soon').length} تنبيهات تشحيم
                </p>
                <span className="text-[9px] text-amber-700 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full inline-block mt-2">
                  مبنية على ساعات التشغيل
                </span>
              </div>
              <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold block">عمليات تم إنجازها حديثاً</span>
                <p className="text-xl font-black text-emerald-800 mt-0.5">
                  {lubrications.filter(l => l.status === 'completed').length} مكتملة
                </p>
                <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mt-2">
                  شحومات معتمدة ISO-9001
                </span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Lubrication Scheduler Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">سجل ومجدول التزييت الدوري للأوناش (Lubrication Schedule)</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">تتبع نقاط الشحم والزيت محددة بساعات التشغيل الفعلية للماكينة</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-black border-b border-slate-200/60">
                    <th className="px-5 py-4">اسم الونش والنقطة الفنية</th>
                    <th className="px-4 py-4 text-center">نوع الزيت / الشحم المستعمل</th>
                    <th className="px-4 py-4 text-center">دورة التشحيم (ساعة)</th>
                    <th className="px-4 py-4 text-center">ساعات التشغيل الفعلية</th>
                    <th className="px-4 py-4 text-center">تاريخ آخر تشحيم</th>
                    <th className="px-4 py-4 text-center">الحالة</th>
                    <th className="px-5 py-4 text-center">إجراء الخدمة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold">
                  {lubrications.map(lub => {
                    const currentHours = cranesHours[lub.craneId] || 480;
                    return (
                      <tr key={lub.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-black text-slate-800">{lub.craneName}</p>
                          <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                            {lub.pointName}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center font-mono text-slate-700">{lub.lubricantType}</td>
                        <td className="px-4 py-4 text-center font-mono text-slate-700">كل {lub.intervalHours} ساعة</td>
                        <td className="px-4 py-4 text-center font-mono font-black text-slate-900">{currentHours} ساعة</td>
                        <td className="px-4 py-4 text-center font-mono text-slate-600">{lub.lastServicedDate}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                            lub.status === 'overdue' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            lub.status === 'due_soon' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {lub.status === 'overdue' ? 'متأخر - يتطلب تشحيم فوراً' :
                             lub.status === 'due_soon' ? 'مستحق قريباً' : 'مكتمل ومستقر'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => {
                              if (onUpdateLubrication) {
                                onUpdateLubrication(lub.id, {
                                  status: 'completed',
                                  lastServicedDate: new Date().toISOString().split('T')[0],
                                  lastServicedHours: currentHours
                                });
                              }
                              alert(`تم تسجيل إتمام عملية التشحيم والتزييت بنجاح لـ "${lub.craneName} - ${lub.pointName}"`);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 mx-auto"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>إثبات التشحيم</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'spareParts' ? (
        <div className="space-y-6">
          {/* Header Ribbon & Create Action */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">طلبات صرف قطع الغيار من المخزن (Spare Parts Requests)</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">ربط مباشر مع أمر الصيانة وخصم أوتوماتيكي من المخزون فور اعتماد المدير</p>
            </div>

            <button
              onClick={() => setShowSparePartModal(true)}
              className="px-4 py-2.5 bg-[#0F4C81] text-white rounded-xl text-xs font-black hover:bg-[#0c3d67] transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء طلب قطع غيار لأمر صيانة</span>
            </button>
          </div>

          {/* Spare Parts Requests Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-black border-b border-slate-200/60">
                    <th className="px-5 py-4">رقم الطلب والونش</th>
                    <th className="px-4 py-4">قطعة الغيار المطلوبة</th>
                    <th className="px-4 py-4 text-center">الكمية المطلوبة</th>
                    <th className="px-4 py-4 text-center">مقدم الطلب والتاريخ</th>
                    <th className="px-4 py-4 text-center">الحالة والموافقة</th>
                    <th className="px-5 py-4 text-center">إجراء الصرف المخزني</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold">
                  {sparePartsRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block mb-1 font-black">
                          {req.requestNo}
                        </span>
                        <p className="font-black text-slate-800">{req.craneName}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-black text-slate-800">{req.partName}</p>
                        {req.notes && <p className="text-[10px] text-slate-400 font-medium">{req.notes}</p>}
                      </td>
                      <td className="px-4 py-4 text-center font-mono font-black text-slate-900 text-sm">
                        {req.quantityRequested} قطع
                      </td>
                      <td className="px-4 py-4 text-center font-mono text-slate-600">
                        <p>{req.requestedBy}</p>
                        <span className="text-[10px] text-slate-400">{req.requestDate}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          req.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                        }`}>
                          {req.status === 'approved' ? 'معتمد ومخصوم من المخزن' :
                           req.status === 'rejected' ? 'مرفوض' : 'بانتظار موافقة الصرف'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {req.status === 'pending' ? (
                          <button
                            onClick={() => {
                              if (onApproveSparePartsRequest) {
                                onApproveSparePartsRequest(req.id);
                              }
                              alert(`تم اعتماد طلب قطع الغيار "${req.partName}" وخصم الكمية أوتوماتيكياً من المخزن!`);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 mx-auto shadow-xs"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>اعتماد وصرف مباشر</span>
                          </button>
                        ) : (
                          <span className="text-emerald-700 text-[10px] font-black flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            تم الصرف أوتوماتيكياً
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'assetBudgets' ? (
        <div className="space-y-6">
          {/* Annual Asset Budget Overview Header Banner */}
          <div className="bg-gradient-to-r from-[#0F4C81] via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>تخصيص الميزانية السنوية ورصد الاستهلاك المباشر (2026)</span>
                </div>
                <h2 className="text-xl font-black">تتبع الميزانيات السنوية للصيانة وتكاليف قطع الغيار لكل أصل</h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  تحديد الميزانية السنوية التقديرية لكل رافعة أو فئة، والتحكم المالي المباشر فور تحرير أوامر الصيانة وطلبات قطع الغيار مع احتساب المصروف الفعلي والمحجوز التقديري.
                </p>
              </div>
              <button
                onClick={() => setShowAddBudgetModal(true)}
                className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 self-start md:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>تخصيص ميزانية أصل جديدة</span>
              </button>
            </div>
          </div>

          {/* Overall Budget KPI Cards */}
          {(() => {
            let totalAllocated = 0;
            let totalActual = 0;
            let totalCommitted = 0;
            let overBudgetCount = 0;

            budgetsList.forEach(b => {
              const metrics = computeBudgetMetrics(b);
              totalAllocated += b.annualBudget;
              totalActual += metrics.actualSpent;
              totalCommitted += metrics.committedEstimated;
              if (metrics.utilizationPercentage >= 90) overBudgetCount++;
            });

            const totalUsed = totalActual + totalCommitted;
            const totalRemaining = totalAllocated - totalUsed;
            const overallUtilization = totalAllocated > 0 ? Math.round((totalUsed / totalAllocated) * 100) : 0;

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                    <span>إجمالي الميزانيات المخصصة</span>
                    <div className="p-2 bg-blue-50 text-[#0F4C81] rounded-xl">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 font-mono">{totalAllocated.toLocaleString()} <span className="text-xs text-slate-500 font-sans font-normal">ريال</span></p>
                  <div className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100 flex justify-between">
                    <span>إجمالي معدل الاستهلاك:</span>
                    <span className="font-mono font-black text-[#0F4C81]">{overallUtilization}%</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                    <span>المصروف الفعلي المعتمد</span>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-emerald-700 font-mono">{totalActual.toLocaleString()} <span className="text-xs text-slate-500 font-sans font-normal">ريال</span></p>
                  <div className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100 flex justify-between">
                    <span>صيانة منتهية + قطع مخصومة</span>
                    <span className="font-mono font-bold text-emerald-800">{Math.round((totalActual / (totalAllocated || 1)) * 100)}%</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                    <span>التكاليف المحجوزة التقديرية</span>
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-amber-700 font-mono">{totalCommitted.toLocaleString()} <span className="text-xs text-slate-500 font-sans font-normal">ريال</span></p>
                  <div className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100 flex justify-between">
                    <span>طلبات معلقة وقيد التنفيذ</span>
                    <span className="font-mono font-bold text-amber-800">{Math.round((totalCommitted / (totalAllocated || 1)) * 100)}%</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                    <span>المتبقي المتاح للتصرف</span>
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                      <BarChart2 className="w-4 h-4" />
                    </div>
                  </div>
                  <p className={`text-2xl font-black font-mono ${totalRemaining < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {totalRemaining.toLocaleString()} <span className="text-xs text-slate-500 font-sans font-normal">ريال</span>
                  </p>
                  <div className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100 flex justify-between">
                    <span>أصول قاربت/تجاوزت الحد:</span>
                    <span className={`font-mono font-black ${overBudgetCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>{overBudgetCount} أصل</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Search & Filter Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
              {['الكل', 'أوناش تلسكوبية', 'أوناش مجنرزة', 'معدات الورشة'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setBudgetCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                    budgetCategoryFilter === cat
                      ? 'bg-[#0F4C81] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="ابحث باسم الأصل أو الملاحظات..."
                value={budgetSearch}
                onChange={(e) => setBudgetSearch(e.target.value)}
                className="w-full pr-9 pl-4 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          {/* Budget Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {budgetsList
              .filter(b => {
                const matchesCat = budgetCategoryFilter === 'الكل' || b.category === budgetCategoryFilter || (b.category && b.category.includes(budgetCategoryFilter));
                const matchesSearch = b.targetNameAr.toLowerCase().includes(budgetSearch.toLowerCase()) || (b.notes && b.notes.toLowerCase().includes(budgetSearch.toLowerCase()));
                return matchesCat && matchesSearch;
              })
              .map(b => {
                const metrics = computeBudgetMetrics(b);
                const isExceeded = metrics.remaining < 0;
                const isNearLimit = metrics.utilizationPercentage >= 80 && !isExceeded;

                return (
                  <div
                    key={b.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between space-y-4 ${
                      isExceeded ? 'border-rose-300 ring-2 ring-rose-100' :
                      isNearLimit ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200/80'
                    }`}
                  >
                    <div>
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              ميزانية عام {b.year}
                            </span>
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700">
                              {b.category || 'أوناش أسطول'}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-slate-900 text-base">{b.targetNameAr}</h3>
                        </div>

                        {/* Status Badge */}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 border ${
                          isExceeded ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          isNearLimit ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {isExceeded ? '🚨 تجاوز الميزانية' :
                           isNearLimit ? '⚠️ قريب من الحد المسموح' : '✅ ضمن الحدود المقررة'}
                        </span>
                      </div>

                      {b.notes && (
                        <p className="text-xs text-slate-500 mt-2 bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                          {b.notes}
                        </p>
                      )}

                      {/* Numbers Breakdown Grid */}
                      <div className="grid grid-cols-3 gap-2 mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">الميزانية المعتمدة</span>
                          <p className="font-mono font-black text-slate-900 text-sm mt-0.5">{b.annualBudget.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">المصروف والالتزامات</span>
                          <p className="font-mono font-black text-[#0F4C81] text-sm mt-0.5">{metrics.totalUsed.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">المتبقي المتاح</span>
                          <p className={`font-mono font-black text-sm mt-0.5 ${metrics.remaining < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {metrics.remaining.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-600">استهلاك الميزانية الفعلي والتقديري:</span>
                          <span className={`font-mono ${
                            isExceeded ? 'text-rose-600 font-black' :
                            isNearLimit ? 'text-amber-600 font-black' : 'text-emerald-700'
                          }`}>
                            {metrics.utilizationPercentage}%
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isExceeded ? 'bg-rose-500' :
                              isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, metrics.utilizationPercentage)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>فعلي معتمد: {metrics.actualSpent.toLocaleString()} ريال</span>
                          <span>محجوز تقديري: {metrics.committedEstimated.toLocaleString()} ريال</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedBudgetDetail(b)}
                        className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>تفاصيل الاستهلاك والأوامر</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingBudget(b);
                          setEditAmount(String(b.annualBudget));
                          setEditNotes(b.notes || '');
                        }}
                        className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-[#0F4C81] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">تكاليف الصيانة الكلية</span>
                <p className="text-xl font-black text-[#0F4C81]">{totalCost.toLocaleString()} ج.م</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0F4C81] flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">الأوامر المعلقة وقيد التنفيذ</span>
                <p className="text-xl font-black text-amber-600">{activeOrders} أمر نشط</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">أوناش الأسطول المعطلة</span>
                <p className="text-xl font-black text-rose-600">
                  {cranes.filter(c => c.status === 'maintenance').length} رافعة بالورشة
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter panel */}
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="relative">
              <input 
                type="text" 
                placeholder="البحث برقم أمر الشغل، اسم الونش، أو تفاصيل العطل..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-11 pl-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
          </div>

          {/* Work Orders grid list */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 font-bold text-slate-700">رقم الأمر</th>
                    <th className="px-6 py-4 font-bold text-slate-700">الونش المستهدف</th>
                    <th className="px-6 py-4 font-bold text-slate-700">نوع الصيانة</th>
                    <th className="px-6 py-4 font-bold text-slate-700">التاريخ المجدول</th>
                    <th className="px-6 py-4 font-bold text-slate-700">التكلفة المتوقعة</th>
                    <th className="px-6 py-4 font-bold text-slate-700">الحالة</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-[#0F4C81]">
                        <div className="flex items-center gap-2">
                          <span>{order.orderNo}</span>
                          {order.faultImage && (
                            <span className="p-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] flex items-center gap-1 font-sans" title="يحتوي على دليل مرئي">
                              <Camera className="w-3 h-3" />
                              <span>دليل 📷</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{order.craneName}</span>
                          {(() => {
                            const hours = cranesHours[order.craneId];
                            if (hours !== undefined) {
                              const milestoneInterval = 250;
                              let nextMilestone = Math.ceil(hours / milestoneInterval) * milestoneInterval;
                              if (nextMilestone === hours) {
                                nextMilestone += milestoneInterval;
                              }
                              const remainingHours = Math.max(0, nextMilestone - hours);
                              if (remainingHours <= 40) {
                                return (
                                  <span 
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      remainingHours <= 15 
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse' 
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}
                                    title={`يقترب من صيانة الـ ${nextMilestone} ساعة (متبقي ${Math.round(remainingHours * 10) / 10} ساعة)`}
                                  >
                                    <AlertTriangle className={`w-3 h-3 ${remainingHours <= 15 ? 'text-rose-500' : 'text-amber-500'}`} />
                                    <span>{remainingHours <= 15 ? 'صيانة حرجة' : 'اقترب الموعد'} ({Math.round(remainingHours)}س)</span>
                                  </span>
                                );
                              }
                            }
                            return null;
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          order.type === 'preventive' ? 'bg-[#0F4C81]/10 text-[#0F4C81]' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {order.type === 'preventive' ? 'وقائية دورية' : 'إصلاح طارئ'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{order.date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-slate-800">{order.cost.toLocaleString()} ج.م</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          order.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                          order.status === 'in_progress' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {order.status === 'completed' ? 'منتهية' :
                           order.status === 'in_progress' ? 'قيد التنفيذ بالورشة' : 'في الانتظار'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-red-500 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* View Details Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] text-right">
            <div className="bg-[#0F4C81] p-6 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-lg">تفاصيل أمر صيانة {selectedOrder.orderNo}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-white hover:bg-white/10 rounded-lg p-1">×</button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">الرافعة المستهدفة:</span>
                <span className="font-bold text-slate-800 text-sm block">{selectedOrder.craneName}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">وصف الأعطال والمهام المطلوبة:</span>
                <p className="text-slate-600 text-xs leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {selectedOrder.description}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold pt-2">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-400 block mb-0.5">تكلفة متوقعة:</span>
                  <span className="text-slate-800 font-extrabold">{selectedOrder.cost.toLocaleString()} ج.م</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-400 block mb-0.5">تاريخ التكليف:</span>
                  <span className="text-slate-800 font-mono">{selectedOrder.date}</span>
                </div>
              </div>

              {/* Fault Camera Capture Component integration inside View Details */}
              <div className="pt-3 border-t border-slate-100">
                <FaultCameraCapture 
                  initialImage={selectedOrder.faultImage}
                  onImageCaptured={(img) => handleUpdateOrderImage(selectedOrder.id, img)}
                  onClear={() => handleClearOrderImage(selectedOrder.id)}
                />
              </div>

              {selectedOrder.status !== 'completed' && (
                <div className="space-y-2 pt-4 border-t sticky bottom-0 bg-white shrink-0">
                  <span className="text-xs text-slate-400 block font-semibold mb-2">تحديث حالة أمر الصيانة:</span>
                  <div className="flex gap-2">
                    {selectedOrder.status === 'pending' && (
                      <button 
                        onClick={() => {
                          handleUpdateStatus(selectedOrder.id, 'in_progress');
                          setSelectedOrder(null);
                        }}
                        className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        بدء تنفيذ الإصلاح بالورشة
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        handleUpdateStatus(selectedOrder.id, 'completed');
                        setSelectedOrder(null);
                      }}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      إنهاء صيانة وتأكيد السلامة
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Maintenance Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] text-right">
            <div className="bg-[#0F4C81] p-6 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-lg">تحرير أمر صيانة للأوناش</h3>
              <button onClick={() => setShowAddForm(false)} className="text-white hover:bg-white/10 rounded-lg p-1">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">رقم الأمر</label>
                <input 
                  type="text" 
                  required
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">الرافعة المعنية</label>
                <select 
                  required
                  value={craneId}
                  onChange={(e) => setCraneId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] bg-white"
                >
                  <option value="">اختر من الأسطول الحالي...</option>
                  {cranes.map(crane => {
                    const hours = cranesHours[crane.id] || 320;
                    const milestoneInterval = 250;
                    let nextMilestone = Math.ceil(hours / milestoneInterval) * milestoneInterval;
                    if (nextMilestone === hours) {
                      nextMilestone += milestoneInterval;
                    }
                    const remainingHours = Math.max(0, nextMilestone - hours);
                    const warningText = remainingHours <= 40 
                      ? ` ⚠️ (صيانة عاجلة - متبقي ${Math.round(remainingHours)}س)` 
                      : '';
                    return (
                      <option key={crane.id} value={crane.id}>
                        {crane.nameAr} - (كود: {crane.code}){warningText}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">تصنيف أمر الشغل</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] bg-white"
                >
                  <option value="preventive">وقائية دورية (فلاتر وزيوت وسيور وفحص)</option>
                  <option value="corrective">إصلاح طارئ (أعطال هيدروليك/كهرباء/ميكانيكا)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">التاريخ</label>
                  <input 
                    type="date" 
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">التكلفة التقديرية (ج.م)</label>
                  <input 
                    type="number" 
                    required
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">توصيف دقيق للمهام والعطل الفني</label>
                <textarea 
                  required
                  placeholder="أدخل الأعطال بالتفصيل ومطالب الرفع والتشحيم..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] resize-none"
                />
              </div>

              {/* Fault Camera Capture Component integration */}
              <div className="pt-2 border-t border-slate-100">
                <FaultCameraCapture 
                  onImageCaptured={(img) => setFaultImage(img)} 
                  initialImage={faultImage} 
                  onClear={() => setFaultImage('')} 
                />
              </div>

              {/* Live Asset Budget Tracker Banner inside Order Form */}
              {(() => {
                if (!craneId) return null;
                const targetB = budgetsList.find(b => b.targetId === craneId || (b.targetType === 'crane' && b.targetId === craneId));
                if (!targetB) return null;
                const metrics = computeBudgetMetrics(targetB);
                const estimatedNewCost = Number(cost) || 0;
                const totalAfter = metrics.totalUsed + estimatedNewCost;
                const isExceeding = totalAfter > targetB.annualBudget;

                return (
                  <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                    isExceeding ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}>
                    <div className="flex justify-between items-center font-bold">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        ميزانية الأصل السنوية المعتمدة (2026):
                      </span>
                      <span className="font-mono text-sm">{targetB.annualBudget.toLocaleString()} ريال</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/60 font-semibold">
                      <div>المستهلك والالتزامات الحالية: <span className="font-mono font-black">{metrics.totalUsed.toLocaleString()} ريال</span></div>
                      <div>التكلفة المقدرة بعد هذا الأمر: <span className="font-mono font-black text-blue-700">{totalAfter.toLocaleString()} ريال</span></div>
                    </div>
                    {isExceeding ? (
                      <div className="flex items-center gap-1.5 text-rose-700 font-black text-[11px] pt-1">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>تنبيه: التكلفة ستتجاوز الميزانية المعتمدة بمقدار {(totalAfter - targetB.annualBudget).toLocaleString()} ريال!</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-[11px] pt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>ضمن الميزانية (المتبقي المتاح: {(targetB.annualBudget - totalAfter).toLocaleString()} ريال).</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex gap-2 pt-4 sticky bottom-0 bg-white shrink-0">
                <button 
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#0F4C81] text-white text-sm font-bold rounded-xl hover:bg-[#0c3d67] transition-colors cursor-pointer"
                >
                  إصدار أمر الصيانة
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFaultImage('');
                  }}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spare Parts Request Modal */}
      {showSparePartModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-[#0F4C81]">
                <Package className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-base text-slate-800">طلب قطع غيار لأمر الصيانة</h3>
              </div>
              <button 
                onClick={() => setShowSparePartModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSparePartsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">ربط بأمر صيانة مفتوح (اخنياري)</label>
                <select
                  value={selectedWorkOrderId}
                  onChange={(e) => setSelectedWorkOrderId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] bg-white font-bold"
                >
                  <option value="">طلب عام / صيانة الورشة العامة</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.orderNo} - {o.craneName} ({o.description.slice(0, 30)}...)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">صنف قطعة الغيار من المخزن المركزي *</label>
                <select
                  required
                  value={selectedInventoryItemId}
                  onChange={(e) => setSelectedInventoryItemId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] bg-white font-bold"
                >
                  <option value="">اختر قطعة الغيار المطلوب صرفها...</option>
                  {inventoryItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.nameAr} (كود: {item.code}) - المتاح بالرصيد: {item.currentQty} {item.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">الكمية المطلوبة *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={sparePartQty}
                    onChange={(e) => setSparePartQty(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">تاريخ الطلب</label>
                  <input
                    type="text"
                    readOnly
                    value={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm font-bold text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">سبب الطلب / مبررات الصرف</label>
                <textarea
                  rows={2}
                  placeholder="أدخل تفاصيل ومبررات تغيير هذه القطعة..."
                  value={sparePartNotes}
                  onChange={(e) => setSparePartNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] resize-none font-bold"
                />
              </div>

              {/* Live Asset Budget Tracker Banner inside Spare Parts Modal */}
              {(() => {
                const selectedReqOrder = orders.find(o => o.id === selectedWorkOrderId);
                const selectedInv = inventoryItems.find(i => i.id === selectedInventoryItemId);
                if (!selectedReqOrder && !selectedInv) return null;
                
                const targetCraneId = selectedReqOrder ? selectedReqOrder.craneId : cranes[0]?.id;
                const targetB = budgetsList.find(b => b.targetId === targetCraneId || (b.targetType === 'crane' && b.targetId === targetCraneId));
                if (!targetB) return null;

                const metrics = computeBudgetMetrics(targetB);
                const estPartCost = (sparePartQty || 1) * (selectedInv?.unitPrice || 1500);
                const totalAfter = metrics.totalUsed + estPartCost;
                const isExceeding = totalAfter > targetB.annualBudget;

                return (
                  <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                    isExceeding ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}>
                    <div className="flex justify-between items-center font-bold">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        ميزانية الأصل السنوية ({targetB.targetNameAr}):
                      </span>
                      <span className="font-mono text-sm">{targetB.annualBudget.toLocaleString()} ريال</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/60 font-semibold">
                      <div>تكلفة قطع الغيار المحددة: <span className="font-mono font-black text-amber-700">{estPartCost.toLocaleString()} ريال</span></div>
                      <div>إجمالي الموقف المالي بعد الطلب: <span className="font-mono font-black text-blue-700">{totalAfter.toLocaleString()} ريال</span></div>
                    </div>
                    {isExceeding ? (
                      <div className="flex items-center gap-1.5 text-rose-700 font-black text-[11px] pt-1">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>تحذير ميزانية: هذا الطلب يتجاوز الاعتماد السنوي للأصل بمقدار {(totalAfter - targetB.annualBudget).toLocaleString()} ريال!</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-[11px] pt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>تغطية ميزانية متوفرة (المتبقي: {(targetB.annualBudget - totalAfter).toLocaleString()} ريال).</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#0F4C81] text-white text-xs font-extrabold rounded-xl hover:bg-[#0c3d67] transition-all cursor-pointer shadow-md"
                >
                  إرسال طلب الصرف
                </button>
                <button
                  type="button"
                  onClick={() => setShowSparePartModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Asset Budget Modal */}
      {showAddBudgetModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] text-right">
            <div className="bg-[#0F4C81] p-6 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-lg">تخصيص ميزانية سنوية جديدة للأصل (2026)</h3>
              <button onClick={() => setShowAddBudgetModal(false)} className="text-white hover:bg-white/10 rounded-lg p-1 text-xl font-bold">×</button>
            </div>

            <form onSubmit={handleAddBudgetSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">نطاق التخصيص *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTargetType('crane')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      newTargetType === 'crane'
                        ? 'bg-[#0F4C81] text-white border-[#0F4C81]'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    رافعة أصل محددة
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTargetType('category')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      newTargetType === 'category'
                        ? 'bg-[#0F4C81] text-white border-[#0F4C81]'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    فئة معدات أسطول
                  </button>
                </div>
              </div>

              {newTargetType === 'crane' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">اختر الرافعة المستهدفة *</label>
                  <select
                    required
                    value={newTargetId}
                    onChange={(e) => setNewTargetId(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] bg-white font-bold"
                  >
                    <option value="">اختر الرافعة...</option>
                    {cranes.map(c => (
                      <option key={c.id} value={c.id}>{c.nameAr} - كود: {c.code}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">اسم الفئة *</label>
                  <select
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] bg-white font-bold"
                  >
                    <option value="أوناش تلسكوبية">أوناش تلسكوبية هيدروليكية</option>
                    <option value="أوناش مجنرزة">أوناش مجنرزة ثقيلة</option>
                    <option value="معدات الورشة">معدات ومولدات الورشة المركزية</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">قيمة الميزانية السنوية المعتمدة (ريال) *</label>
                <input
                  type="number"
                  min={1000}
                  step={5000}
                  required
                  placeholder="مثال: 150000"
                  value={newAnnualBudget}
                  onChange={(e) => setNewAnnualBudget(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">ملاحظات والتزامات التشغيل</label>
                <textarea
                  rows={2}
                  placeholder="أي توصيات مالية أو اشتراطات للصيانة الوقائية..."
                  value={newBudgetNotes}
                  onChange={(e) => setNewBudgetNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] resize-none"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-md"
                >
                  حفظ وتخصيص الميزانية
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddBudgetModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Budget Modal */}
      {editingBudget && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden flex flex-col text-right">
            <div className="bg-[#0F4C81] p-6 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-lg">تعديل الميزانية السنوية لـ {editingBudget.targetNameAr}</h3>
              <button onClick={() => setEditingBudget(null)} className="text-white hover:bg-white/10 rounded-lg p-1 text-xl font-bold">×</button>
            </div>

            <form onSubmit={handleEditBudgetSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">قيمة الميزانية التقديرية المعتمدة (ريال)</label>
                <input
                  type="number"
                  required
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">الملاحظات والاشتراطات</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] resize-none"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#0F4C81] text-white text-xs font-extrabold rounded-xl hover:bg-[#0c3d67] transition-all cursor-pointer shadow-md"
                >
                  تحديث الميزانية
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBudget(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Budget Movements Detail Modal */}
      {selectedBudgetDetail && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] text-right">
            <div className="bg-[#0F4C81] p-6 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-lg">سجل استهلاك ميزانية: {selectedBudgetDetail.targetNameAr}</h3>
                <p className="text-xs text-slate-200 font-mono mt-0.5">الميزانية المقررة لعام 2026: {selectedBudgetDetail.annualBudget.toLocaleString()} ريال</p>
              </div>
              <button onClick={() => setSelectedBudgetDetail(null)} className="text-white hover:bg-white/10 rounded-lg p-1 text-xl font-bold">×</button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {(() => {
                const metrics = computeBudgetMetrics(selectedBudgetDetail);
                return (
                  <>
                    {/* Summary Row */}
                    <div className="grid grid-cols-4 gap-2 text-center p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold">
                      <div>
                        <span className="text-slate-400 text-[10px] block">المحول المعتمد</span>
                        <p className="font-mono text-slate-900 text-sm">{selectedBudgetDetail.annualBudget.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">مصروف فعلي</span>
                        <p className="font-mono text-emerald-700 text-sm">{metrics.actualSpent.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">محجوز تقديري</span>
                        <p className="font-mono text-amber-700 text-sm">{metrics.committedEstimated.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">المتبقي المتاح</span>
                        <p className={`font-mono text-sm ${metrics.remaining < 0 ? 'text-rose-600 font-black' : 'text-blue-700'}`}>
                          {metrics.remaining.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Section 1: Orders Charged */}
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                        <Wrench className="w-4 h-4 text-[#0F4C81]" />
                        <span>أوامر الصيانة والتشغيل المرتبطة ({metrics.completedOrders.length + metrics.pendingOrders.length})</span>
                      </h4>
                      <div className="space-y-2">
                        {[...metrics.completedOrders, ...metrics.pendingOrders].map(o => (
                          <div key={o.id} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 font-mono font-bold text-slate-800">
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px]">{o.orderNo}</span>
                                <span>{o.craneName}</span>
                              </div>
                              <p className="text-slate-500 text-[11px] mt-1">{o.description}</p>
                            </div>
                            <div className="text-left font-mono font-black">
                              <p className="text-slate-900 text-sm">{o.cost.toLocaleString()} ريال</p>
                              <span className={`text-[10px] font-sans px-2 py-0.5 rounded-full ${
                                o.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {o.status === 'completed' ? 'منتهية وفعلي' : 'قيد التنفيذ / محجوز'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 2: Spare Parts Charged */}
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-amber-600" />
                        <span>طلبات قطع الغيار والصرف ({metrics.approvedParts.length + metrics.pendingParts.length})</span>
                      </h4>
                      <div className="space-y-2">
                        {[...metrics.approvedParts, ...metrics.pendingParts].map(r => {
                          const cost = r.totalCost || ((r.quantityRequested || 1) * 1500);
                          return (
                            <div key={r.id} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2 font-mono font-bold text-slate-800">
                                  <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded text-[10px]">{r.requestNo}</span>
                                  <span>{r.partName} ({r.quantityRequested} قطع)</span>
                                </div>
                                <p className="text-slate-400 text-[10px] mt-0.5">طلب بواسطة: {r.requestedBy} بتاريخ {r.requestDate}</p>
                              </div>
                              <div className="text-left font-mono font-black">
                                <p className="text-slate-900 text-sm">{cost.toLocaleString()} ريال</p>
                                <span className={`text-[10px] font-sans px-2 py-0.5 rounded-full ${
                                  r.status === 'approved' || r.status === 'fulfilled' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {r.status === 'approved' || r.status === 'fulfilled' ? 'معتمد وفعلي' : 'قيد الموافقات'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
