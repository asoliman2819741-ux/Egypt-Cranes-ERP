import React, { useState, useEffect } from 'react';
import { Crane, MaintenanceOrder } from '../types';
import { 
  Bell, BellOff, AlertTriangle, ShieldAlert, CheckCircle2, Clock, 
  Settings, Mail, MessageSquare, Smartphone, Play, HelpCircle, 
  Sparkles, Wrench, ChevronDown, Check, ArrowLeft, RefreshCw, Send, Plus, Fuel
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MaintenanceNotificationsProps {
  cranes: Crane[];
  cranesHours: Record<string, number>;
  setCranesHours: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onTriggerWorkOrder: (data: {
    craneId: string;
    type: 'preventive' | 'corrective';
    description: string;
    cost: number;
  }) => void;
  orders: MaintenanceOrder[];
}

export interface PushNotification {
  id: string;
  craneId: string;
  craneCode: string;
  craneName: string;
  hours?: number;
  targetHours?: number;
  hoursRemaining?: number;
  message: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  isRead: boolean;
  type: 'preventive_due' | 'critical_overdue' | 'fuel_excess';
  standardFuelRate?: number;
  actualFuelRate?: number;
}

interface DeliveryLog {
  id: string;
  time: string;
  type: 'sms' | 'email' | 'system';
  recipient: string;
  content: string;
  status: 'delivered' | 'failed' | 'pending';
}

export default function MaintenanceNotifications({
  cranes,
  cranesHours,
  setCranesHours,
  onTriggerWorkOrder,
  orders
}: MaintenanceNotificationsProps) {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [toasts, setToasts] = useState<PushNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'logs' | 'settings'>('active');
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  // Settings states
  const [settings, setSettings] = useState({
    notifyThreshold: 25, // alert when within 25 hours
    enableEmail: true,
    enableSMS: true,
    enableBrowserToast: true,
    managerEmail: 'asoliman@egyptcranes.com',
    operatorSMS: true,
    autoCreateDraft: false,
  });

  // Pre-defined standard/nominal fuel consumption rates (Liters per hour of operation)
  const standardFuelRates: Record<string, number> = {
    c1: 18.0,
    c2: 14.5,
    c3: 28.0,
    c4: 35.0,
    c5: 15.0,
  };

  // Sensor/Actual real-time fuel consumption rates (Liters per hour)
  // c4 starts as exceeding to trigger the alert immediately
  const [actualFuelRates, setActualFuelRates] = useState<Record<string, number>>({
    c1: 17.2,
    c2: 13.8,
    c3: 27.5,
    c4: 39.8, // standard is 35.0
    c5: 14.1,
  });

  // Delivery channel logs
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([
    {
      id: 'log-1',
      time: '16:20:05',
      type: 'email',
      recipient: 'asoliman@egyptcranes.com',
      content: 'تنبيه صيانة وقائية: ونش ليبهير LR 1600/2 يقترب من حاجز 1000 ساعة (متبقي 11 ساعة).',
      status: 'delivered'
    },
    {
      id: 'log-2',
      time: '16:20:06',
      type: 'sms',
      recipient: 'كابتن توفيق النبوي (01014125132)',
      content: 'تنبيه نظام الصيانة: كابتن توفيق، يرجى الاستعداد لتسليم الونش لورشة الجيزة لإجراء صيانة الـ 1000 ساعة الدورية قريباً.',
      status: 'delivered'
    },
    {
      id: 'log-3',
      time: '14:15:32',
      type: 'email',
      recipient: 'asoliman@egyptcranes.com',
      content: 'تنبيه صيانة وقائية: ونش جروف Grove GMK 5130-2 يقترب من صيانة الـ 250 ساعة (متبقي 8 ساعات).',
      status: 'delivered'
    }
  ]);

  // Evaluate hours and fuel consumption to trigger notifications
  useEffect(() => {
    const newNotifications: PushNotification[] = [];
    
    // 1. Evaluate hours-based notifications
    Object.entries(cranesHours).forEach(([id, hours]) => {
      const crane = cranes.find(c => c.id === id);
      if (!crane) return;

      // Maintenance milestone blocks (250, 500, 750, 1000, 1250, 1500)
      const milestoneInterval = 250;
      const nextMilestone = Math.ceil(hours / milestoneInterval) * milestoneInterval;
      
      // Calculate remaining hours to next milestone
      const hoursRemaining = nextMilestone - hours;

      if (hoursRemaining <= settings.notifyThreshold && hoursRemaining >= 0) {
        const priority = hoursRemaining <= 10 ? 'high' : hoursRemaining <= 20 ? 'medium' : 'low';
        
        newNotifications.push({
          id: `notif-${id}-${nextMilestone}`,
          craneId: id,
          craneCode: crane.code,
          craneName: crane.nameAr,
          hours: Math.round(hours * 10) / 10,
          targetHours: nextMilestone,
          hoursRemaining: Math.round(hoursRemaining * 10) / 10,
          message: `يقترب الونش ${crane.nameAr} (${crane.code}) من موعد الصيانة الوقائية الدورية الكبرى المحددة عند ${nextMilestone} ساعة تشغيل. متبقي له فقط ${Math.round(hoursRemaining * 10) / 10} ساعة عمل فنية.`,
          priority,
          createdAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          isRead: false,
          type: 'preventive_due'
        });
      } else if (hoursRemaining > milestoneInterval - 10) {
        // Overdue or just crossed milestone without maintenance
        const crossedMilestone = nextMilestone - milestoneInterval;
        if (crossedMilestone > 0 && hours - crossedMilestone < 20) {
          // Just crossed milestone (overdue)
          newNotifications.push({
            id: `notif-${id}-${crossedMilestone}-overdue`,
            craneId: id,
            craneCode: crane.code,
            craneName: crane.nameAr,
            hours: Math.round(hours * 10) / 10,
            targetHours: crossedMilestone,
            hoursRemaining: 0,
            message: `⚠️ تحذير حرج: تجاوز الونش ${crane.nameAr} (${crane.code}) حاجز الصيانة المعتمد (${crossedMilestone} ساعة تشغيل). الونش يعمل الآن بدون صيانة وقائية منذ ${Math.round((hours - crossedMilestone) * 10) / 10} ساعات!`,
            priority: 'high',
            createdAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            isRead: false,
            type: 'critical_overdue'
          });
        }
      }
    });

    // 2. Evaluate fuel consumption rate alerts
    Object.entries(actualFuelRates).forEach(([id, rawRate]) => {
      const crane = cranes.find(c => c.id === id);
      if (!crane) return;

      const actualRate = rawRate as number;
      const standardRate = standardFuelRates[id] || 15.0;
      if (actualRate > standardRate) {
        const excessPercent = Math.round(((actualRate - standardRate) / standardRate) * 100);
        
        newNotifications.push({
          id: `notif-fuel-${id}`,
          craneId: id,
          craneCode: crane.code,
          craneName: crane.nameAr,
          message: `🚨 تنبيه استهلاك وقود حرج: الونش ${crane.nameAr} (${crane.code}) يتجاوز معدل استهلاك الوقود المعياري المسموح به! المعدل المعياري: ${standardRate} لتر/ساعة، المعدل الحالي المرصود: ${actualRate} لتر/ساعة (زيادة بنسبة ${excessPercent}%). يرجى فحص فلاتر الديزل أو احتمالية وجود تسريب!`,
          priority: 'high',
          createdAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          isRead: false,
          type: 'fuel_excess',
          standardFuelRate: standardRate,
          actualFuelRate: actualRate
        });
      }
    });

    // Check if there are any actually new notifications to push (trigger toast)
    newNotifications.forEach(notif => {
      const alreadyExists = notifications.some(existing => existing.id === notif.id);
      if (!alreadyExists && settings.enableBrowserToast) {
        // Trigger Toast & dispatch simulated Email/SMS logs
        setToasts(prev => [notif, ...prev]);
        
        // Add Delivery Logs
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        const newLogs: DeliveryLog[] = [];

        if (settings.enableEmail) {
          newLogs.push({
            id: `log-email-${Date.now()}-${notif.id}`,
            time: timestamp,
            type: 'email',
            recipient: settings.managerEmail,
            content: `[دفع تلقائي] ${notif.message}`,
            status: 'delivered'
          });
        }

        const craneObj = cranes.find(c => c.id === notif.craneId);
        if (settings.enableSMS && craneObj) {
          const smsText = notif.type === 'fuel_excess'
            ? `تنبيه وقود عاجل للونش ${craneObj.code}: تخطى معدل الاستهلاك بـ ${Math.round(((notif.actualFuelRate! - notif.standardFuelRate!) / notif.standardFuelRate!) * 100)}%. يرجى التوقف للفحص فوراً!`
            : `تنبيه صيانة عاجل: يرجى التوجه لورشة الجيزة لإجراء الفحص الدوري عند ${notif.targetHours} ساعة تشغيل.`;

          newLogs.push({
            id: `log-sms-${Date.now()}-${notif.id}`,
            time: timestamp,
            type: 'sms',
            recipient: `${craneObj.operatorName} (مشغل الونش)`,
            content: smsText,
            status: 'delivered'
          });
        }

        if (newLogs.length > 0) {
          setDeliveryLogs(prev => [ ...newLogs, ...prev]);
        }

        // Auto remove toast after 6 seconds
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== notif.id));
        }, 6000);
      }
    });

    setNotifications(newNotifications);
  }, [cranesHours, actualFuelRates, settings.notifyThreshold, settings.enableBrowserToast, settings.enableEmail, settings.enableSMS, settings.managerEmail]);

  // Simulation: increment hours periodically
  useEffect(() => {
    if (!isAutoSimulating) return;

    const interval = setInterval(() => {
      setCranesHours(prev => {
        const next = { ...prev };
        // Increment each crane operating hours by random step (0.5 to 1.5 hours)
        Object.keys(next).forEach(craneId => {
          next[craneId] = next[craneId] + 0.5 + Math.random() * 1.5;
        });
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoSimulating]);

  // Trigger manually triggering a notification (for testing/easy review)
  const handleForceIncrement = (craneId: string) => {
    setCranesHours(prev => {
      const current = prev[craneId] || 0;
      // Find what the next milestone is
      const milestoneInterval = 250;
      const nextMilestone = Math.ceil(current / milestoneInterval) * milestoneInterval;
      
      // Bump operating hours to exactly 12 hours before the next milestone to trigger notification instantly!
      const targetHours = nextMilestone - 12;
      
      return {
        ...prev,
        [craneId]: targetHours
      };
    });
  };

  const handleForceOverdue = (craneId: string) => {
    setCranesHours(prev => {
      const current = prev[craneId] || 0;
      const milestoneInterval = 250;
      const nextMilestone = Math.ceil(current / milestoneInterval) * milestoneInterval;
      
      // Bump to exactly 2 hours PAST the milestone (overdue)
      const targetHours = nextMilestone + 2;
      return {
        ...prev,
        [craneId]: targetHours
      };
    });
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const activeAlertsCount = notifications.length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Absolute Overlay Toasts (Web Push Mimicry) */}
      <div className="fixed top-6 right-6 z-[9999] max-w-sm w-full space-y-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const isFuel = toast.type === 'fuel_excess';
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 200, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.9, transition: { duration: 0.2 } }}
                className={`pointer-events-auto bg-slate-900 border-l-4 p-4 rounded-xl shadow-2xl text-white dir-rtl flex gap-3 relative overflow-hidden ${
                  isFuel ? 'border-l-rose-500' : 'border-l-amber-500'
                }`}
                dir="rtl"
              >
                {/* Pulse effect border */}
                <div className={`absolute inset-y-0 right-0 w-1 animate-pulse ${isFuel ? 'bg-rose-500' : 'bg-amber-500'}`} />
                
                <div className="flex-shrink-0 pt-0.5">
                  <div className={`p-2 rounded-lg ${isFuel ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {isFuel ? <Fuel className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                  </div>
                </div>

                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                      isFuel ? 'bg-rose-500/20 text-rose-300 animate-pulse' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {isFuel ? 'إنذار وقود ذكي ⛽🚨' : 'إشعار دفع للمديرين 🖥️'}
                    </span>
                    <button 
                      onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                      className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                  
                  <h4 className="text-xs font-black text-slate-100 flex items-center gap-1">
                    <span>{isFuel ? `تجاوز الاستهلاك: ${toast.craneCode}` : `اقتراب موعد صيانة: ${toast.craneCode}`}</span>
                  </h4>
                  
                  <p className="text-[11px] text-slate-300 font-semibold leading-relaxed">
                    {toast.message}
                  </p>

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800 mt-2">
                    <span className="text-[10px] text-slate-400 font-mono">{toast.createdAt}</span>
                    {isFuel ? (
                      <button
                        onClick={() => {
                          onTriggerWorkOrder({
                            craneId: toast.craneId,
                            type: 'corrective',
                            description: `[أمر صيانة طارئ لعلاج هدر الوقود]: يرجى فحص دورة السولار، استبدال فلاتر الديزل المسدودة ومعايرة رشاشات المحرك للونش ${toast.craneCode} لحل مشكلة تخطي معدل الاستهلاك بـ ${Math.round(((toast.actualFuelRate! - toast.standardFuelRate!) / toast.standardFuelRate!) * 100)}%.`,
                            cost: 6800
                          });
                          setToasts(prev => prev.filter(t => t.id !== toast.id));
                        }}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 rounded text-[9px] text-white font-black transition-colors cursor-pointer"
                      >
                        أمر فحص استهلاك الوقود 🛠️
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onTriggerWorkOrder({
                            craneId: toast.craneId,
                            type: 'preventive',
                            description: `[أمر شغل ناتج عن إشعار صيانة دفع حركي]: يرجى فحص الونش وإجراء الصيانة الوقائية الدورية لتجاوز حاجز الـ ${toast.targetHours} ساعة تشغيل بنجاح.`,
                            cost: 15000
                          });
                          setToasts(prev => prev.filter(t => t.id !== toast.id));
                        }}
                        className="px-2.5 py-1 bg-[#0F4C81] hover:bg-[#0c3d67] rounded text-[9px] text-white font-black transition-colors cursor-pointer"
                      >
                        جدولة صيانة فورية 🛠️
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Main UI Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: System controls & Simulation Panel */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Active Hours Status List & Controller */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#0F4C81]" />
                <span>حالة ساعات العمل ومحاكي التشغيل</span>
              </h3>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${isAutoSimulating ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {isAutoSimulating ? 'المحاكاة نشطة' : 'المحاكاة متوقفة'}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              هنا يمكنك استعراض ساعات التشغيل الحالية لكل رافعة، ومحاكاة زيادة الساعات يدوياً أو تلقائياً لتجربة إرسال إشعارات الدفع الحية للمديرين:
            </p>

            <div className="space-y-3.5 pt-1">
              {cranes.map(crane => {
                const hours = cranesHours[crane.id] || 0;
                const milestoneInterval = 250;
                const nextMilestone = Math.ceil(hours / milestoneInterval) * milestoneInterval;
                const percent = Math.min(100, (hours % milestoneInterval) / milestoneInterval * 100);
                const hoursLeft = nextMilestone - hours;

                return (
                  <div key={crane.id} className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5">
                        <span className="font-mono font-black text-xs text-slate-800 block">{crane.code}</span>
                        <span className="text-[10px] text-slate-500 font-extrabold block">{crane.nameAr}</span>
                      </div>
                      <div className="text-left font-mono">
                        <span className="text-xs font-black text-slate-900 block">{Math.round(hours * 10) / 10} ساعة</span>
                        <span className="text-[9px] text-slate-400 block font-bold">المستهدف: {nextMilestone} س</span>
                      </div>
                    </div>

                    {/* Progress to next maintenance milestone */}
                    <div className="space-y-1">
                      <div className="h-1.5 bg-slate-200 rounded-full w-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            hoursLeft <= 15 ? 'bg-rose-500 animate-pulse' :
                            hoursLeft <= 30 ? 'bg-amber-500' : 'bg-[#0F4C81]'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold">
                        <span>متبقي: {Math.round(hoursLeft * 10) / 10} ساعة عمل</span>
                        <span>{Math.round(percent)}%</span>
                      </div>
                    </div>

                    {/* Test triggers */}
                    <div className="flex gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleForceIncrement(crane.id)}
                        className="flex-1 py-1 px-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-extrabold rounded-lg transition-colors cursor-pointer"
                      >
                        ⚡ اقتراب صيانة (-12 ساعة)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleForceOverdue(crane.id)}
                        className="flex-1 py-1 px-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[9px] font-extrabold rounded-lg transition-colors cursor-pointer"
                      >
                        🚨 محاكاة تأخير (+2 ساعة)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Auto Simulation Trigger Button */}
            <button
              type="button"
              onClick={() => setIsAutoSimulating(!isAutoSimulating)}
              className={`w-full py-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isAutoSimulating 
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
                  : 'bg-[#0F4C81] text-white border-transparent hover:bg-[#0c3d67]'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAutoSimulating ? 'animate-spin' : ''}`} />
              <span>{isAutoSimulating ? 'إيقاف محاكي التشغيل التلقائي' : 'تفعيل محاكي تراكم الساعات الآلي (+1 س/د)'}</span>
            </button>
          </div>

          {/* Fuel Consumption Controller and Monitoring Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                <Fuel className="w-4 h-4 text-rose-500" />
                <span>مستشعر ومحاكي استهلاك الوقود ⛽</span>
              </h3>
              <span className="bg-rose-50 text-rose-700 px-2 py-0.5 text-[9px] font-bold rounded-full animate-pulse">
                مراقبة حية 🚨
              </span>
            </div>

            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              يقارن النظام لحظياً بين معدل استهلاك الوقود الفعلي (لتر/ساعة) للرافعات والحد المعياري الأقصى المعين لكل موديل. يمكنك تحريك مؤشرات التحكم لمحاكاة الهدر أو تسريب الديزل ورؤية الإنذار الذكي الفوري:
            </p>

            <div className="space-y-4 pt-1">
              {cranes.map(crane => {
                const standard = standardFuelRates[crane.id] || 15.0;
                const actual = actualFuelRates[crane.id] || 15.0;
                const isExceeding = actual > standard;
                const excessPercent = isExceeding ? Math.round(((actual - standard) / standard) * 100) : 0;

                return (
                  <div key={`fuel-sim-${crane.id}`} className={`p-3 rounded-2xl border space-y-2.5 transition-all duration-300 ${isExceeding ? 'bg-rose-50/40 border-rose-200 shadow-3xs' : 'bg-slate-50/70 border-slate-100'}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-slate-800">{crane.code}</span>
                          {isExceeding && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-extrabold block leading-tight">{crane.nameAr}</span>
                      </div>
                      <div className="text-left font-mono">
                        <span className={`text-xs font-black block ${isExceeding ? 'text-rose-600' : 'text-slate-900'}`}>{actual.toFixed(1)} لتر/س</span>
                        <span className="text-[9px] text-slate-400 block font-bold">المعياري: {standard.toFixed(1)} لتر/س</span>
                      </div>
                    </div>

                    {/* Fuel slider slider */}
                    <div className="space-y-1">
                      <input 
                        type="range" 
                        min={Math.round(standard * 0.4 * 10) / 10} 
                        max={Math.round(standard * 1.6 * 10) / 10} 
                        step="0.1"
                        value={actual}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setActualFuelRates(prev => ({ ...prev, [crane.id]: val }));
                        }}
                        className="w-full accent-rose-600 cursor-pointer"
                      />
                      
                      <div className="flex justify-between items-center text-[9px] font-black">
                        <span className="text-slate-400">توفير</span>
                        {isExceeding ? (
                          <span className="text-rose-600">⚠️ تجاوز حرج بـ +{excessPercent}%</span>
                        ) : (
                          <span className="text-emerald-600">✓ كفاءة آمنة</span>
                        )}
                        <span className="text-slate-400">حمل جائر</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Side: Notification Display & Configurations */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          
          {/* Header and navigation inside the push alerts hub */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#0F4C81]/10 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#0F4C81] animate-bounce" />
                </span>
                <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                  <span>لوحة دفع الإشعارات للمديرين</span>
                  {activeAlertsCount > 0 && (
                    <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full animate-pulse">
                      {activeAlertsCount} تنبيهات معلقة
                    </span>
                  )}
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-bold">بوابة التحكم وإرسال الإشارات اللحظية للسلامة والتشغيل للأوناش الثقيلة</p>
            </div>

            {/* Quick Channel Tab Selection */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-150 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${activeTab === 'active' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                التنبيهات النشطة ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('logs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${activeTab === 'logs' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                سجل إرسال الدفع ({deliveryLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                إعدادات البوابة
              </button>
            </div>
          </div>

          {/* Active Notifications Tab */}
          {activeTab === 'active' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold">الإشعارات المستخرجة بناءً على مستشعر الساعات المباشر:</span>
                {notifications.length > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-[#0F4C81] hover:underline font-black cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    تحديد الكل كمقروء
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-slate-800">أسطول الأوناش سليم وآمن بالكامل!</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      لا توجد أي رافعة تقترب حالياً من حاجز صيانة دوري أقل من حد التنبيه ({settings.notifyThreshold} ساعة). جميع مستشعرات الساعات في النطاق الآمن.
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-lg">
                      نصيحة: يمكنك استخدام "محاكي اقتراب الصيانة" بالجانب الأيمن لتوليد تنبيهات حية فوراً.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  <AnimatePresence initial={false}>
                    {notifications.map((notif) => {
                      const isFuel = notif.type === 'fuel_excess';
                      return (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                            notif.type === 'critical_overdue' 
                              ? 'bg-rose-50/70 border-rose-100 hover:bg-rose-50' 
                              : isFuel
                                ? 'bg-rose-50/45 border-rose-200/80 hover:bg-rose-50/70 shadow-3xs'
                                : 'bg-amber-50/50 border-amber-100 hover:bg-amber-50'
                          }`}
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide flex items-center gap-1 ${
                                notif.type === 'critical_overdue' 
                                  ? 'bg-rose-100 text-rose-700 animate-pulse' 
                                  : isFuel
                                    ? 'bg-rose-100 text-rose-700 animate-pulse border border-rose-200'
                                    : 'bg-amber-100 text-amber-800'
                              }`}>
                                {notif.type === 'critical_overdue' 
                                  ? '⚠️ تجاوز حرج للمدة' 
                                  : isFuel 
                                    ? '⛽ تنبيه استهلاك وقود حرج' 
                                    : '⏳ اقتراب الصيانة'}
                              </span>
                              <span className="bg-[#0F4C81] text-white px-2 py-0.5 rounded font-mono text-[10px] font-black">
                                {notif.craneCode}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono font-bold">
                                تم الرصد: {notif.createdAt}
                              </span>
                            </div>

                            <p className="text-xs text-slate-800 font-bold leading-relaxed">
                              {notif.message}
                            </p>

                            <div className="flex items-center gap-4 text-[10px] font-extrabold text-slate-500 flex-wrap">
                              {isFuel ? (
                                <>
                                  <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                                    <Fuel className="w-3.5 h-3.5 text-rose-500" />
                                    الاستهلاك الفعلي الحالي: <strong className="font-mono">{notif.actualFuelRate} لتر/ساعة</strong>
                                  </span>
                                  <span className="text-slate-300">|</span>
                                  <span>المعدل المعياري الأقصى المسموح به: <strong className="font-mono text-slate-700">{notif.standardFuelRate} لتر/ساعة</strong></span>
                                </>
                              ) : (
                                <>
                                  <span className="flex items-center gap-1 text-slate-700">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    العداد الحالي: <strong className="font-mono text-[#0F4C81]">{notif.hours}س</strong>
                                  </span>
                                  <span className="text-slate-300">|</span>
                                  <span>المستهدف الوقائي القادم: <strong className="font-mono text-[#0F4C81]">{notif.targetHours}س</strong></span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Quick action buttons */}
                          <div className="flex items-center md:flex-col justify-end gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 flex-shrink-0">
                            {isFuel ? (
                              <button
                                type="button"
                                onClick={() => onTriggerWorkOrder({
                                  craneId: notif.craneId,
                                  type: 'corrective',
                                  description: `[أمر صيانة طارئ لعلاج هدر الوقود]: يرجى فحص دورة السولار، استبدال فلاتر الديزل المسدودة ومعايرة رشاشات المحرك للونش ${notif.craneCode} لحل مشكلة تخطي معدل الاستهلاك بـ ${Math.round(((notif.actualFuelRate! - notif.standardFuelRate!) / notif.standardFuelRate!) * 100)}%.`,
                                  cost: 6800
                                })}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <Wrench className="w-3.5 h-3.5 animate-spin-slow" />
                                <span>أمر فحص استهلاك الوقود 🛠️</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onTriggerWorkOrder({
                                  craneId: notif.craneId,
                                  type: 'preventive',
                                  description: `[أمر شغل ناتج عن إشعار صيانة دفع حركي]: يرجى فحص الونش وإجراء الصيانة الوقائية الدورية لتجاوز حاجز الـ ${notif.targetHours} ساعة تشغيل بنجاح.`,
                                  cost: 15000
                                })}
                                className="px-4 py-2 bg-[#0F4C81] hover:bg-[#0c3d67] text-white text-xs font-black rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <Wrench className="w-3.5 h-3.5" />
                                <span>جدولة الصيانة الفورية</span>
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}

              {/* Delivery Analytics Info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">إجمالي إرسال الـ SMS</span>
                  <div className="text-base font-black text-slate-800 font-mono flex items-center justify-center gap-1">
                    <MessageSquare className="w-4 h-4 text-[#0F4C81]" />
                    {deliveryLogs.filter(l => l.type === 'sms').length} رسائل
                  </div>
                </div>
                <div className="text-center space-y-1 border-r border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">إجمالي البريد الإلكتروني</span>
                  <div className="text-base font-black text-slate-800 font-mono flex items-center justify-center gap-1">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    {deliveryLogs.filter(l => l.type === 'email').length} إرسال
                  </div>
                </div>
                <div className="text-center space-y-1 border-r border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">متوسط الاستجابة الوقائية</span>
                  <div className="text-base font-black text-slate-800 flex items-center justify-center gap-1">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    ٩٤% فوري
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">سجلات إرسال إشعارات الدفع (Push Logs) عبر القنوات المختلفة:</span>
                <button 
                  onClick={() => setDeliveryLogs([])}
                  className="text-xs text-rose-600 hover:underline font-bold"
                >
                  مسح السجلات تاريخياً
                </button>
              </div>

              {deliveryLogs.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 text-slate-400 text-xs">
                  لا توجد سجلات حالية. سيتم تسجيل عمليات البث المباشر هنا بمجرد توليد إشعار.
                </div>
              ) : (
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-4 py-3 font-bold text-slate-600">الوقت</th>
                          <th className="px-4 py-3 font-bold text-slate-600">القناة البثية</th>
                          <th className="px-4 py-3 font-bold text-slate-600">المستلم والمشغل</th>
                          <th className="px-4 py-3 font-bold text-slate-600">محتوى رسالة الدفع</th>
                          <th className="px-4 py-3 font-bold text-slate-600 text-center">الحالة الإشارية</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 divide-y-reverse">
                        {deliveryLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-mono text-slate-500 font-medium">{log.time}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold ${
                                log.type === 'sms' ? 'bg-[#0F4C81]/10 text-[#0F4C81]' : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {log.type === 'sms' ? <Smartphone className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                                {log.type === 'sms' ? 'رسالة نصية SMS' : 'بريد للمهندسين'}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-extrabold text-slate-700">{log.recipient}</td>
                            <td className="px-4 py-3 text-slate-600 font-medium max-w-xs truncate">{log.content}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                                تم التسليم ✓
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Configuration Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              <span className="text-xs text-slate-400 font-bold block">إعداد صمامات تنبيهات الصيانة لأسطول الرفع الثقيل:</span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Threshold slider */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <span className="text-xs font-extrabold text-slate-700 block flex items-center gap-1">
                    <Clock className="w-4 h-4 text-[#0F4C81]" />
                    <span>معدل تنبيه اقتراب الساعات</span>
                  </span>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-black">
                      <span className="text-slate-500">بداية إرسال الإشعار للمدير:</span>
                      <span className="text-[#0F4C81]">{settings.notifyThreshold} ساعة تشغيل قبل الموعد</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="100" 
                      step="5"
                      value={settings.notifyThreshold}
                      onChange={(e) => setSettings({ ...settings, notifyThreshold: parseInt(e.target.value) })}
                      className="w-full accent-[#0F4C81] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                      <span>عاجل وحرج (5 س)</span>
                      <span>متوسط المدى (50 س)</span>
                      <span>إخطار مبكر (100 س)</span>
                    </div>
                  </div>
                </div>

                {/* Switch list */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5">
                  <span className="text-xs font-extrabold text-slate-700 block flex items-center gap-1">
                    <Settings className="w-4 h-4 text-[#0F4C81]" />
                    <span>قنوات إرسال وبث التنبيه المباشرة</span>
                  </span>

                  <div className="space-y-2.5">
                    
                    {/* Browser web push */}
                    <label className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors cursor-pointer">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-800 block">إشعار دفع المتصفح (Web Push)</span>
                        <span className="text-[9px] text-slate-400 block font-bold">إظهار كروت حية في زاوية الشاشة</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.enableBrowserToast}
                        onChange={(e) => setSettings({ ...settings, enableBrowserToast: e.target.checked })}
                        className="w-4.5 h-4.5 accent-[#0F4C81] cursor-pointer"
                      />
                    </label>

                    {/* Email */}
                    <label className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors cursor-pointer">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-800 block">بريد المهندسين المناوبين (Email Dispatch)</span>
                        <span className="text-[9px] text-slate-400 block font-bold">إرسال تقرير فني لبريد الصيانة المعتمد</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.enableEmail}
                        onChange={(e) => setSettings({ ...settings, enableEmail: e.target.checked })}
                        className="w-4.5 h-4.5 accent-[#0F4C81] cursor-pointer"
                      />
                    </label>

                    {/* SMS */}
                    <label className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors cursor-pointer">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-800 block">رسائل قصيرة لمشغلي الأوناش (SMS Alert)</span>
                        <span className="text-[9px] text-slate-400 block font-bold">إبلاغ السائق بتقرير العداد قبل مغادرة البوابة</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.enableSMS}
                        onChange={(e) => setSettings({ ...settings, enableSMS: e.target.checked })}
                        className="w-4.5 h-4.5 accent-[#0F4C81] cursor-pointer"
                      />
                    </label>

                  </div>
                </div>

              </div>

              {/* Advanced recipient configurations */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5">
                <span className="text-xs font-extrabold text-slate-700 block">تفاصيل جهات الإرسال وبوابة الـ API:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-500 font-bold">بريد مدير الأنظمة والصيانة الرئيسي</label>
                    <input 
                      type="email" 
                      value={settings.managerEmail}
                      onChange={(e) => setSettings({ ...settings, managerEmail: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-500 font-bold">رابط ترحيل إشارات بوابة الدفع للمتصفح</label>
                    <input 
                      type="text" 
                      disabled
                      value="https://api.egyptcranes.com/v1/push/dispatcher"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
