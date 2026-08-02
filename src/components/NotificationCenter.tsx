import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, BellOff, CheckCircle2, AlertTriangle, ShieldAlert, 
  Wrench, Archive, Check, X, Shield, FileCheck, Layers, 
  ArrowLeftRight, Calendar, UserCheck, Eye, Trash2, ShieldX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ApprovalRequest, LeaveRequest, MaintenanceOrder, 
  InventoryItem, GatePass, FixedAsset, User 
} from '../types';

interface NotificationCenterProps {
  currentUser: User;
  approvalRequests: ApprovalRequest[];
  onUpdateApprovalRequests: (requests: ApprovalRequest[]) => void;
  leaveRequests: LeaveRequest[];
  onUpdateLeaveRequest: (id: string, updatedFields: Partial<LeaveRequest>) => void;
  maintenanceOrders: MaintenanceOrder[];
  inventoryItems: InventoryItem[];
  gatePasses: GatePass[];
  fixedAssets: FixedAsset[];
  setPage: (page: string) => void;
}

interface NotificationItem {
  id: string;
  category: 'approval' | 'maintenance' | 'security' | 'inventory';
  title: string;
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
  isRead: boolean;
  actionable?: boolean;
  actionType?: 'approval' | 'leave';
  refId: string;
  meta?: any;
}

export default function NotificationCenter({
  currentUser,
  approvalRequests,
  onUpdateApprovalRequests,
  leaveRequests,
  onUpdateLeaveRequest,
  maintenanceOrders,
  inventoryItems,
  gatePasses,
  fixedAssets,
  setPage
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'approvals' | 'maintenance' | 'security'>('all');
  const [readNotifications, setReadNotifications] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pre-select role filter based on the currentUser roleName / jobTitle
  const getInitialRoleFilter = () => {
    const title = (currentUser?.jobTitle || '').toLowerCase();
    const role = (currentUser?.roleName || '').toLowerCase();
    
    if (title.includes('صيانة') || role.includes('صيانة') || title.includes('ورشة') || title.includes('مهندس')) {
      return 'maintenance';
    }
    if (title.includes('أمن') || role.includes('أمن') || title.includes('سلامة') || title.includes('مخازن') || title.includes('أمين')) {
      return 'security';
    }
    if (title.includes('عام') || title.includes('مالي') || title.includes('مدير') || role.includes('مدير') || title.includes('اعتماد')) {
      return 'approval';
    }
    return 'all';
  };

  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>(getInitialRoleFilter());
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Construct Notification list dynamically based on ERP states
  const notifications: NotificationItem[] = [];

  // 1. Add pending approvals
  approvalRequests.forEach(req => {
    if (req.status === 'pending') {
      notifications.push({
        id: `approval-${req.id}`,
        category: 'approval',
        title: 'طلب اعتماد معلق',
        message: `${req.requestedByName} يطلب اعتماد ${req.screenName === 'accounts' ? 'شجرة الحسابات' : req.screenName === 'contracts' ? 'العقود' : req.screenName}: ${req.recordSummary}`,
        timestamp: req.requestDate,
        severity: req.type === 'delete' ? 'critical' : 'warning',
        isRead: readNotifications.includes(`approval-${req.id}`),
        actionable: true,
        actionType: 'approval',
        refId: req.id,
        meta: req
      });
    }
  });

  // 2. Add pending leave requests
  leaveRequests.forEach(req => {
    if (req.status === 'pending') {
      notifications.push({
        id: `leave-${req.id}`,
        category: 'approval',
        title: 'طلب إجازة معلق',
        message: `طلب إجازة ${req.type === 'annual' ? 'سنوية' : req.type === 'sick' ? 'مرضية' : 'طارئة'} للموظف ${req.empName} لمدة ${req.days} أيام بسبب: ${req.reason}`,
        timestamp: req.startDate,
        severity: 'info',
        isRead: readNotifications.includes(`leave-${req.id}`),
        actionable: true,
        actionType: 'leave',
        refId: req.id,
        meta: req
      });
    }
  });

  // 3. Add pending maintenance orders
  maintenanceOrders.forEach(order => {
    if (order.status === 'pending') {
      notifications.push({
        id: `maint-${order.id}`,
        category: 'maintenance',
        title: `أمر صيانة قادم (${order.type === 'preventive' ? 'وقائي' : 'طارئ'})`,
        message: `مطلوب إجراء صيانة لـ ${order.craneName} - الوصف: ${order.description}`,
        timestamp: order.date,
        severity: order.type === 'corrective' ? 'critical' : 'warning',
        isRead: readNotifications.includes(`maint-${order.id}`),
        refId: order.id,
        meta: order
      });
    }
  });

  // 4. Add low inventory items
  inventoryItems.forEach(item => {
    if (item.currentQty <= item.minQty) {
      notifications.push({
        id: `inv-${item.id}`,
        category: 'inventory',
        title: 'تنبيه نقص المخزون 📦',
        message: `المادة (${item.nameAr}) في مستودع (${item.warehouseName}) تجاوزت حد الطلب الأدنى. الكمية الحالية: ${item.currentQty} ${item.unit} (الحد الأدنى: ${item.minQty})`,
        timestamp: new Date().toISOString().split('T')[0],
        severity: 'critical',
        isRead: readNotifications.includes(`inv-${item.id}`),
        refId: item.id,
        meta: item
      });
    }
  });

  // 5. Add Gate pass scan failures (Security)
  gatePasses.forEach(pass => {
    if (pass.hasScanFail) {
      notifications.push({
        id: `gate-${pass.id}`,
        category: 'security',
        title: 'إنذار أمني: فشل تصريح البوابة 🛑',
        message: `المركبة المصاحبة لـ ${pass.driverName} سجلت فشل التحقق في البوابة. المفقودات: ${pass.missingItems.join('، ') || 'عدم تطابق الوزن والمستندات'}`,
        timestamp: pass.timestamp,
        severity: 'critical',
        isRead: readNotifications.includes(`gate-${pass.id}`),
        refId: pass.id,
        meta: pass
      });
    }
  });

  // 6. Fixed assets maintenance reminders
  fixedAssets.forEach(asset => {
    if (asset.maintenanceLog) {
      asset.maintenanceLog.forEach((log: any) => {
        if (log.status === 'pending') {
          notifications.push({
            id: `asset-maint-${log.id || asset.id}`,
            category: 'maintenance',
            title: `صيانة أصل ثابت: ${asset.nameAr}`,
            message: `صيانة دورية معلقة للأصل (${asset.nameAr}) في موقع: ${asset.location}. تكلفة مقدرة: ${log.cost} ر.س.`,
            timestamp: log.date,
            severity: 'warning',
            isRead: readNotifications.includes(`asset-maint-${log.id || asset.id}`),
            refId: asset.id,
            meta: log
          });
        }
      });
    }
  });

  // 7. Simulated real-time security alerts based on current roles to show dynamic system safety
  const simulatedAlerts: NotificationItem[] = [
    {
      id: 'sim-sec-1',
      category: 'security',
      title: 'رصد محاولة دخول خارج الدوام',
      message: 'محاولة تسجيل دخول للمستخدم (asoliman) خارج الساعات الرسمية من IP خارجي تم حظرها تلقائياً.',
      timestamp: '2026-07-14 18:30',
      severity: 'warning',
      isRead: readNotifications.includes('sim-sec-1'),
      refId: 'sim-1'
    },
    {
      id: 'sim-sec-2',
      category: 'security',
      title: 'تحذير تجاوز السرعة الجغرافية للرافعة',
      message: 'الرافعة Liebherr LTM 11200 سجلت سرعة 45 كم/س في منطقة تشغيلية محددة بـ 20 كم/س كحد أقصى.',
      timestamp: '2026-07-14 17:15',
      severity: 'critical',
      isRead: readNotifications.includes('sim-sec-2'),
      refId: 'sim-2'
    }
  ];

  // Merge simulated security alerts
  simulatedAlerts.forEach(alert => {
    notifications.push(alert);
  });

  // Filter based on active tab and job role filter
  const filteredNotifications = notifications.filter(n => {
    // 1. Job Role filter check
    if (selectedRoleFilter === 'approval' && n.category !== 'approval') return false;
    if (selectedRoleFilter === 'maintenance' && n.category !== 'maintenance') return false;
    if (selectedRoleFilter === 'security' && n.category !== 'security' && n.category !== 'inventory') return false;

    // 2. Tab filter check
    if (activeTab === 'all') return true;
    if (activeTab === 'approvals') return n.category === 'approval';
    if (activeTab === 'maintenance') return n.category === 'maintenance';
    if (activeTab === 'security') return n.category === 'security' || n.category === 'inventory';
    return true;
  });

  // Unread items count (total pending + active notifications that are not read)
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Direct action handlers for quick approvals
  const handleApproveRequest = (id: string, itemType: 'approval' | 'leave') => {
    if (itemType === 'approval') {
      const updated = approvalRequests.map(r => r.id === id ? {
        ...r,
        status: 'approved' as const,
        approverName: currentUser.fullName,
        actionDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
        notes: 'تمت الموافقة السريعة عبر مركز الإشعارات المركزي'
      } : r);
      onUpdateApprovalRequests(updated);
      showToast('✔️ تم اعتماد الطلب بنجاح وتحديث قيود النظام.');
    } else {
      onUpdateLeaveRequest(id, {
        status: 'approved',
        reason: 'تم الاعتماد السريع عبر مركز الإشعارات المركزي'
      });
      showToast('✔️ تم قبول طلب الإجازة بنجاح وتحديث ملف الموظف.');
    }
    // Mark as read
    setReadNotifications(prev => [...prev, `${itemType}-${id}`]);
  };

  const handleRejectRequest = (id: string, itemType: 'approval' | 'leave') => {
    if (itemType === 'approval') {
      const updated = approvalRequests.map(r => r.id === id ? {
        ...r,
        status: 'rejected' as const,
        approverName: currentUser.fullName,
        actionDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
        notes: 'تم الرفض السريع عبر مركز الإشعارات المركزي'
      } : r);
      onUpdateApprovalRequests(updated);
      showToast('❌ تم رفض واعتماد إلغاء الطلب بنجاح.');
    } else {
      onUpdateLeaveRequest(id, {
        status: 'rejected'
      });
      showToast('❌ تم رفض طلب الإجازة وتحديث ملف الموظف.');
    }
    // Mark as read
    setReadNotifications(prev => [...prev, `${itemType}-${id}`]);
  };

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadNotifications(allIds);
    showToast('✔️ تم تحديد جميع التنبيهات كمقروءة.');
  };

  const toggleReadStatus = (id: string) => {
    if (readNotifications.includes(id)) {
      setReadNotifications(prev => prev.filter(item => item !== id));
    } else {
      setReadNotifications(prev => [...prev, id]);
    }
  };

  const getSeverityStyles = (severity: 'info' | 'warning' | 'critical', isRead: boolean) => {
    if (isRead) return 'border-slate-100 bg-white opacity-60';
    switch (severity) {
      case 'critical':
        return 'border-rose-150 bg-rose-50/70 hover:bg-rose-50';
      case 'warning':
        return 'border-amber-150 bg-amber-50/70 hover:bg-amber-50';
      case 'info':
      default:
        return 'border-blue-150 bg-blue-50/70 hover:bg-blue-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'approval':
        return <FileCheck className="w-4 h-4 text-[#0F4C81]" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-amber-600" />;
      case 'security':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'inventory':
        return <Archive className="w-4 h-4 text-rose-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notifications trigger button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-slate-500 hover:text-[#0F4C81] hover:bg-slate-50 rounded-xl transition-all duration-200 focus:outline-none"
        aria-label="تنبيهات النظام المركزي"
        id="notification-bell-btn"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-swing' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-600 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-black text-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 mt-3 w-96 md:w-[450px] bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-50 text-right font-sans"
            id="notification-dropdown-panel"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black flex items-center gap-2">
                  <Shield className="w-4.5 h-4.5 text-[#F7941D]" />
                  <span>مركز التنبيهات والإشعارات المركزي</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">لوحة موحدة لمراقبة الموافقات، الصيانة والأمن التشغيلي</p>
              </div>
              
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] text-[#F7941D] hover:text-white font-bold transition-colors flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 hover:border-slate-600"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>تحديد الكل كمقروء</span>
                </button>
              )}
            </div>

            {/* Custom Tab Bar */}
            <div className="flex border-b border-slate-100 bg-slate-50 p-1">
              {[
                { id: 'all', label: 'الكل', count: notifications.length },
                { id: 'approvals', label: 'الموافقات والمهام', count: notifications.filter(n => n.category === 'approval').length },
                { id: 'maintenance', label: 'الصيانة والتشغيل', count: notifications.filter(n => n.category === 'maintenance').length },
                { id: 'security', label: 'الأمن والمخاطر', count: notifications.filter(n => n.category === 'security' || n.category === 'inventory').length },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all duration-200 text-center flex items-center justify-center gap-1.5 ${
                    activeTab === tab.id 
                      ? 'bg-white text-[#0F4C81] shadow-sm border border-slate-100' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                      activeTab === tab.id ? 'bg-[#0F4C81] text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Filter by Job Role Selection */}
            <div className="px-4 py-2 bg-indigo-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[10px] text-slate-500 font-extrabold flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-[#0F4C81]" />
                <span>تصفية مخصصة حسب الدور الوظيفي:</span>
              </span>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="text-[10px] bg-white border border-slate-200 rounded-lg px-2 py-1 font-black focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 cursor-pointer"
              >
                <option value="all">كل الأدوار والمسؤوليات 🌐</option>
                <option value="approval">المدراء التنفيذيون (الموافقات فقط) ⚖️</option>
                <option value="maintenance">مدراء الصيانة والورش (أعطال الأوناش) 🛠️</option>
                <option value="security">أمن وسلامة ومخازن (مخاطر البوابات والمخزون) 🚨</option>
              </select>
            </div>

            {/* Notification items list */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-50 p-2 space-y-1">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <BellOff className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-700">لا توجد إشعارات حالياً</p>
                    <p className="text-[10px] text-slate-400 mt-1">كل شيء يسير على ما يرام في مختلف الوحدات والعمليات!</p>
                  </div>
                </div>
              ) : (
                filteredNotifications.map(item => (
                  <div 
                    key={item.id} 
                    className={`p-3 border rounded-xl transition-all duration-200 flex flex-col gap-2.5 ${getSeverityStyles(item.severity, item.isRead)}`}
                  >
                    {/* Top Row: Category Icon + Title + Timestamp */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-white/80 rounded-lg shadow-sm border border-slate-100">
                          {getCategoryIcon(item.category)}
                        </span>
                        <div>
                          <span className="text-[11px] font-black text-slate-800 block">
                            {item.title}
                          </span>
                          <span className="text-[8px] font-mono text-slate-400 mt-0.5">
                            {item.timestamp}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => toggleReadStatus(item.id)}
                          className="p-1 hover:bg-white rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                          title={item.isRead ? "تحديد كغير مقروء" : "تحديد كمقروء"}
                        >
                          <Check className={`w-3.5 h-3.5 ${item.isRead ? 'text-emerald-500 font-bold' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Middle Row: Message text */}
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {item.message}
                    </p>

                    {/* Action Panel for approvals & leave */}
                    {item.actionable && !item.isRead && (
                      <div className="flex gap-2 justify-end border-t border-slate-200/50 pt-2.5 mt-0.5">
                        <button
                          onClick={() => handleApproveRequest(item.refId, item.actionType as any)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                        >
                          <Check className="w-3 h-3" />
                          <span>موافقة سريعة</span>
                        </button>
                        <button
                          onClick={() => handleRejectRequest(item.refId, item.actionType as any)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                        >
                          <X className="w-3 h-3" />
                          <span>رفض</span>
                        </button>
                      </div>
                    )}

                    {/* Operational Actions (Navigate to module) */}
                    {!item.actionable && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => {
                            if (item.category === 'maintenance') setPage('maintenance');
                            if (item.category === 'inventory') setPage('inventory');
                            if (item.category === 'security') setPage('gate');
                            setIsOpen(false);
                          }}
                          className="text-[10px] text-[#0F4C81] hover:text-[#F7941D] font-bold flex items-center gap-1 transition-colors hover:underline"
                        >
                          <span>انتقال للوحدة الشقيقة</span>
                          <span className="text-[11px]">&larr;</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-bold">
              <span>آخر تحديث تلقائي: {new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
              <button 
                onClick={() => {
                  setPage('saveApproval');
                  setIsOpen(false);
                }}
                className="text-[#0F4C81] hover:text-[#F7941D] hover:underline"
              >
                عرض سجل الموافقات الشامل &larr;
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global alert toast inside notifications button container */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-6 bg-slate-900 border border-slate-800 text-white font-sans text-xs font-bold py-3 px-5 rounded-xl shadow-xl flex items-center gap-2.5 z-50 animate-in fade-in"
          >
            <div className="w-5 h-5 rounded-full bg-[#F7941D] flex items-center justify-center text-white font-black">!</div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
