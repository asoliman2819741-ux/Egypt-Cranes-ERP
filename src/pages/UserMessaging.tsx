import React, { useState, useEffect } from 'react';
import { UserMessage, User } from '../types';
import { 
  Mail, Bell, ShieldAlert, FileCheck, Check, Trash2, Search, Filter, 
  MessageSquare, UserCheck, Play, Plus, Clock, CheckCircle2, RefreshCw, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserMessagingProps {
  currentUser: User;
  messages: UserMessage[];
  onUpdateMessages: (messages: UserMessage[]) => void;
  setPage: (page: string) => void;
}

const initialUserMessages: UserMessage[] = [
  // For Admin (User ID '1')
  { id: 'm1', userId: '1', sender: 'النظام الآلي (ERP)', title: 'تنبيه أمني هام: حظر محاولة تسجيل دخول مشبوهة 🚨', message: 'تم رصد محاولة وصول مجهولة ومريبة من عنوان IP خارجي خارج أوقات العمل الرسمية للمستخدم (asoliman). تم إيقاف وحجب الجلسة تلقائياً من قبل جدار حماية خادم Egypt Cranes الرئيسي.', timestamp: '2026-07-15 18:30', category: 'alert', isRead: false },
  { id: 'm2', userId: '1', sender: 'نوران عادل (الموارد البشرية)', title: 'طلب اعتماد إجازة معلق للموظف: شريف عبد الحفيظ 📅', message: 'يرجى مراجعة واعتماد طلب الإجازة الطارئة المقدم من السائق شريف عبد الحفيظ لمدة يوم واحد بسبب ظرف صحي طارئ وعيادة طبيب الأسنان.', timestamp: '2026-07-15 10:15', category: 'task', isRead: false, taskStatus: 'pending', actionUrl: 'hr', actionText: 'انتقال لموديول الموظفين' },
  { id: 'm3', userId: '1', sender: 'الورشة المركزية بالجيزة', title: 'تقرير صيانة ونش جنزير ليبهير LR 1600/2 ⚙️', message: 'تم بنجاح استبدال صمامات الضغط الهيدروليكي العالي للونش LR 1600 في ورشة الجيزة. المعدة الآن جاهزة كلياً للتشغيل والتحرك لموقع بورسعيد.', timestamp: '2026-07-14 15:45', category: 'reply', isRead: true },
  { id: 'm4', userId: '1', sender: 'بوابة الحركة والأمن', title: 'أمر خروج رافعة ديمباج EC-CR-250 🚛', message: 'تم فحص رافعة ديمباج ٢٥٠ طن والتأكد من مطابقة تصريح البوابة رقم GP-OUT-9081 وسلامة حساسات البوم والميل. الونش غادر البوابة متوجهاً لموقع العاصمة الإدارية.', timestamp: '2026-07-14 09:00', category: 'order', isRead: true },

  // For Financial Admin (User ID '2' - Mohamed Khalil)
  { id: 'm5', userId: '2', sender: 'المدير العام (أشرف سليمان)', title: 'مهمة عمل: مطابقة تسوية شيك شركة المقاولون العرب 💸', message: 'مطلوب مراجعة كشف حساب شركة المقاولون العرب والتحقق من كود الشيك رقم CK-7821459 بقيمة 450,000 ج.م المسحوب على البنك الأهلي المصري.', timestamp: '2026-07-15 11:00', category: 'task', isRead: false, taskStatus: 'pending', actionUrl: 'accounts', actionText: 'شجرة الحسابات' },
  { id: 'm6', userId: '2', sender: 'النظام المالي الذكي', title: 'الرد على طلبك: تم اعتماد الفاتورة الإلكترونية الموحدة INV-2026-101 ✅', message: 'أشرف سليمان قام باعتماد الفاتورة رقم INV-2026-101 لشركة المقاولون العرب بقيمة 450,000 ج.م وتم ترحيل القيد تلقائياً إلى السجل العام.', timestamp: '2026-07-14 12:30', category: 'reply', isRead: false },
  { id: 'm7', userId: '2', sender: 'المخازن والتوريد', title: 'تنبيه نقص مخزون: فلاتر سولار أوناش ديمباج 📦', message: 'تجاوز صنف (فلتر ديزل زيت أصلي أوناش ديمباج و ليبهير) حد الأمان الأدنى المسموح به في المخزن الرئيسي بالجيزة. الكمية الحالية: 14 وحدة (الحد الأدنى: 25 وحدة). يرجى إصدار طلب توريد عاجل.', timestamp: '2026-07-14 08:15', category: 'alert', isRead: true },

  // For Maintenance Engineer (User ID '3' - Yasser Hassan)
  { id: 'm8', userId: '3', sender: 'النظام الآلي (ERP)', title: 'أمر تشغيل صيانة دورية مجدولة: الونش Demag AC 250-5 🛠️', message: 'تم إسناد أمر الصيانة الدورية المجدولة رقم WO-2026-002 للونش ديمباج ٢٥٠ طن إليك. يرجى مراجعة وايرات الرفع واستبدال فلاتر الزيت والسولار وإغلاق الملف بالسيستم.', timestamp: '2026-07-15 08:30', category: 'task', isRead: false, taskStatus: 'pending', actionUrl: 'maintenance', actionText: 'عرض أوامر الصيانة' },
  { id: 'm9', userId: '3', sender: 'المدير العام (أشرف سليمان)', title: 'تمت الموافقة على سلفة الصيانة العاجلة 💸', message: 'تم تحويل واعتماد سلفة الصيانة الطارئة بمبلغ 25,000 ج.م لشراء قطع غيار هيدروليكية لونش CC 2400 بورسعيد نقداً من الخزينة الرئيسية.', timestamp: '2026-07-14 16:30', category: 'reply', isRead: false },
];

export default function UserMessaging({ currentUser, messages, onUpdateMessages, setPage }: UserMessagingProps) {
  // Ensure we have messages seeded in LocalStorage if first time
  useEffect(() => {
    if (messages.length === 0) {
      onUpdateMessages(initialUserMessages);
    }
  }, [messages, onUpdateMessages]);

  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  useEffect(() => {
    const savedLang = localStorage.getItem('egypt_cranes_lang');
    if (savedLang === 'en' || savedLang === 'ar') {
      setLang(savedLang);
    }
  }, []);

  // UI Filter States
  const [activeTab, setActiveTab] = useState<'all' | 'alert' | 'task' | 'reply' | 'order'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSimulatePanel, setShowSimulatePanel] = useState(false);

  // Message Simulator State
  const [simMsg, setSimMsg] = useState({
    sender: 'النظام التجريبي الذكي',
    title: '',
    message: '',
    category: 'alert' as 'alert' | 'task' | 'reply' | 'order',
  });

  const t = (key: string) => {
    const translations: Record<string, Record<'ar' | 'en', string>> = {
      title: { ar: 'صندوق الرسائل والمهام الموحد للمستخدم', en: 'Unified User Messaging & Task Inbox' },
      subtitle: { ar: 'الرسائل الداخلية وتنبيهات الأمان، مراجعة ردود الاعتمادات، وأوامر التشغيل والمهام اليومية المنسوبة إليك', en: 'Internal notifications, security alerts, approval responses, and assigned work tasks' },
      tab_all: { ar: 'كل الرسائل والمهام', en: 'All Messages & Tasks' },
      tab_alert: { ar: 'تنبيهات الأمان والمخاطر 🚨', en: 'Security & Risks' },
      tab_task: { ar: 'المهام المعلقة والطلبات 📝', en: 'Assigned Tasks' },
      tab_reply: { ar: 'الردود وتعميد العمليات 🔄', en: 'Approval Responses' },
      tab_order: { ar: 'أوامر تشغيل وصيانة النظام ⚙️', en: 'System Work Orders' },
      search_placeholder: { ar: 'ابحث في الرسائل، العناوين، أو المرسلين...', en: 'Search in messages, titles, or senders...' },
      mark_read: { ar: 'تحديد كمقروء', en: 'Mark as Read' },
      mark_unread: { ar: 'تحديد كغير مقروء', en: 'Mark as Unread' },
      delete_msg: { ar: 'حذف الرسالة', en: 'Delete Message' },
      task_complete: { ar: 'تم إنجاز المهمة بنجاح ✔️', en: 'Task Completed ✔_' },
      task_pending: { ar: 'قيد التنفيذ', en: 'Task Pending' },
      no_messages: { ar: 'صندوق الرسائل فارغ تماماً ومطابق!', en: 'Inbox is completely empty and up to date!' },
      no_messages_desc: { ar: 'لا توجد رسائل معلقة أو تنبيهات غير مقروءة في هذا التصنيف حالياً.', en: 'There are no pending messages or unread alerts in this category.' },
      sim_panel: { ar: 'لوحة محاكاة وتوليد إشعارات النظام المباشرة 🛠️', en: 'Live System Notifications Generator Simulator 🛠_' },
      sim_desc: { ar: 'استخدم هذه اللوحة لمحاكاة توليد إشعارات، تنبيهات أمنية، مهام منسوبة، أو ردود فورية لاختبار استجابة النظام بأكمله.', en: 'Use this panel to simulate generating immediate alerts, tasks, or responses to test system responsiveness.' },
      sim_sender: { ar: 'اسم الراسل الافتراضي', en: 'Default Senders Name' },
      sim_title: { ar: 'عنوان الرسالة / التنبيه', en: 'Notification Title' },
      sim_msg_body: { ar: 'محتوى وبنية الرسالة التفصيلي', en: 'Detailed message body' },
      sim_cat: { ar: 'فئة الإشعار', en: 'Notification Category' },
      sim_btn: { ar: 'بث وإطلاق الإشعار فوراً بالمنظومة', en: 'Broadcast and Launch System Notification Immediately' }
    };
    return translations[key]?.[lang] || key;
  };

  // Filter messages for current user
  // Also support 'all' user messages if target is 'all'
  const userMessages = messages.filter(m => m.userId === currentUser.id || m.userId === 'all');

  // Filter by category and search
  const filteredMessages = userMessages.filter(m => {
    const matchesCategory = activeTab === 'all' || m.category === activeTab;
    const matchesSearch = searchTerm === '' || 
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.sender.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Action handlers
  const handleToggleRead = (msgId: string) => {
    const updated = messages.map(m => {
      if (m.id === msgId) {
        return { ...m, isRead: !m.isRead };
      }
      return m;
    });
    onUpdateMessages(updated);
  };

  const handleDeleteMessage = (msgId: string) => {
    const updated = messages.filter(m => m.id !== msgId);
    onUpdateMessages(updated);
  };

  const handleToggleTaskStatus = (msgId: string) => {
    const updated = messages.map(m => {
      if (m.id === msgId) {
        const newStatus = m.taskStatus === 'pending' ? 'completed' as const : 'pending' as const;
        return { 
          ...m, 
          taskStatus: newStatus,
          isRead: newStatus === 'completed' ? true : m.isRead // auto mark read when completed
        };
      }
      return m;
    });
    onUpdateMessages(updated);
  };

  const handleSimulateMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simMsg.title || !simMsg.message) return;

    const newSystemMessage: UserMessage = {
      id: `m-sim-${Date.now()}`,
      userId: currentUser.id, // send to current user
      sender: simMsg.sender || 'النظام المركزي للمحاكاة',
      title: simMsg.title,
      message: simMsg.message,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      category: simMsg.category,
      isRead: false,
      taskStatus: simMsg.category === 'task' ? 'pending' : undefined
    };

    onUpdateMessages([newSystemMessage, ...messages]);
    setShowSimulatePanel(false);

    // Reset Form
    setSimMsg({
      sender: 'النظام التجريبي الذكي',
      title: '',
      message: '',
      category: 'alert'
    });
  };

  const getCategoryIcon = (category: 'alert' | 'task' | 'reply' | 'order') => {
    switch (category) {
      case 'alert':
        return <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-150"><ShieldAlert className="w-5 h-5 animate-bounce" /></div>;
      case 'task':
        return <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-150"><MessageSquare className="w-5 h-5" /></div>;
      case 'reply':
        return <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-150"><FileCheck className="w-5 h-5" /></div>;
      case 'order':
      default:
        return <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-150"><Clock className="w-5 h-5" /></div>;
    }
  };

  const getTabCount = (category: 'all' | 'alert' | 'task' | 'reply' | 'order') => {
    if (category === 'all') return userMessages.length;
    return userMessages.filter(m => m.category === category).length;
  };

  const unreadCount = userMessages.filter(m => !m.isRead).length;

  return (
    <div className="space-y-6 font-sans text-right" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Mail className="w-6.5 h-6.5 text-[#0F4C81]" />
            <span>{t('title')}</span>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 bg-rose-600 text-white rounded-full text-[10px] font-black animate-pulse">
                {unreadCount} {lang === 'ar' ? 'جديد' : 'New'}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">{t('subtitle')}</p>
        </div>

        {/* Action Toggle Panel */}
        <button
          onClick={() => setShowSimulatePanel(!showSimulatePanel)}
          className="px-4 py-2 bg-[#F7941D] hover:bg-[#e08316] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
        >
          <Play className="w-4 h-4" />
          <span>{showSimulatePanel ? 'إغلاق لوحة المحاكاة' : 'فتح محاكي إشعارات النظام'}</span>
        </button>
      </div>

      {/* SIMULATOR DRAWER (ACCORDION STYLE) */}
      <AnimatePresence>
        {showSimulatePanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-indigo-50/55 p-5 rounded-2xl border border-indigo-100 space-y-4 overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                  <Play className="w-4 h-4 text-[#0F4C81]" />
                  <span>{t('sim_panel')}</span>
                </h3>
                <p className="text-[10px] text-indigo-700 mt-1">{t('sim_desc')}</p>
              </div>
              <button onClick={() => setShowSimulatePanel(false)} className="text-indigo-400 hover:text-indigo-600 font-extrabold text-sm">&times;</button>
            </div>

            <form onSubmit={handleSimulateMessage} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-black text-indigo-800 mb-1">{t('sim_sender')}</label>
                <input
                  type="text"
                  required
                  value={simMsg.sender}
                  onChange={(e) => setSimMsg({ ...simMsg, sender: e.target.value })}
                  placeholder="مثال: مهندس موقع العاصمة..."
                  className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-indigo-800 mb-1">{t('sim_cat')}</label>
                <select
                  value={simMsg.category}
                  onChange={(e) => setSimMsg({ ...simMsg, category: e.target.value as any })}
                  className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-xs font-bold"
                >
                  <option value="alert">تنبيه أمني عاجل 🚨</option>
                  <option value="task">مهمة إدارية منسوبة 📝</option>
                  <option value="reply">رد واعتماد طلبات 🔄</option>
                  <option value="order">أمر تشغيل أسطول ⚙️</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-indigo-800 mb-1">{t('sim_title')}</label>
                <input
                  type="text"
                  required
                  value={simMsg.title}
                  onChange={(e) => setSimMsg({ ...simMsg, title: e.target.value })}
                  placeholder="عنوان الإشعار القصير والمثير للانتباه..."
                  className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-xs font-bold"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-[10px] font-black text-indigo-800 mb-1">{t('sim_msg_body')}</label>
                <textarea
                  required
                  rows={2}
                  value={simMsg.message}
                  onChange={(e) => setSimMsg({ ...simMsg, message: e.target.value })}
                  placeholder="اكتب تفاصيل الإشعار بالكامل لاختبار مدى مرونة وفهم واجهة المستخدم للرسالة..."
                  className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-xs font-bold"
                />
              </div>

              <div className="md:col-span-4 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F4C81] hover:bg-[#0c3c66] text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('sim_btn')}</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FILTER TABS & SEARCH CONTAINER */}
      <div className="space-y-4">
        {/* Tab Selection Row */}
        <div className="flex overflow-x-auto bg-slate-100 p-1 rounded-2xl gap-1">
          {[
            { id: 'all', label: t('tab_all') },
            { id: 'alert', label: t('tab_alert') },
            { id: 'task', label: t('tab_task') },
            { id: 'reply', label: t('tab_reply') },
            { id: 'order', label: t('tab_order') },
          ].map(tab => {
            const count = getTabCount(tab.id as any);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-white text-[#0F4C81] shadow-xs font-black' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/50'
                }`}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                    activeTab === tab.id ? 'bg-[#0F4C81] text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Field */}
        <div className="relative">
          <Search className="absolute right-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#0F4C81] text-right"
          />
        </div>
      </div>

      {/* MESSAGES CONTAINER */}
      <div className="space-y-3">
        {filteredMessages.length === 0 ? (
          <div className="bg-white py-16 px-4 rounded-2xl border border-slate-100 text-center text-slate-400 font-bold shadow-3xs flex flex-col items-center justify-center space-y-3">
            <Mail className="w-12 h-12 text-slate-200 animate-pulse" />
            <h3 className="text-sm text-slate-700">{t('no_messages')}</h3>
            <p className="text-[10px] text-slate-400 leading-normal max-w-xs">{t('no_messages_desc')}</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredMessages.map(msg => (
              <motion.div
                layout
                key={msg.id}
                className={`p-4 bg-white rounded-2xl border transition-all duration-200 shadow-3xs flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                  msg.isRead 
                    ? 'border-slate-100 bg-white/60 opacity-75' 
                    : 'border-slate-200 bg-gradient-to-l from-indigo-50/20 to-white ring-1 ring-indigo-500/5'
                }`}
              >
                {/* Message Core Details */}
                <div className="flex items-start gap-4 flex-1">
                  {getCategoryIcon(msg.category)}

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-lg border border-slate-200/50">
                        {msg.sender}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">{msg.timestamp}</span>
                      
                      {!msg.isRead && (
                        <span className="w-2 h-2 rounded-full bg-rose-600 block animate-ping" />
                      )}
                    </div>

                    <h3 className={`text-xs sm:text-sm font-black text-slate-950 ${msg.isRead ? 'text-slate-700' : ''}`}>
                      {msg.title}
                    </h3>

                    <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-3xl">
                      {msg.message}
                    </p>

                    {/* Operational Link Button if URL provided */}
                    {msg.actionUrl && (
                      <div className="pt-2">
                        <button
                          onClick={() => setPage(msg.actionUrl!)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[#0F4C81] border border-slate-200 rounded-lg text-[10px] font-extrabold transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{msg.actionText || 'عرض التفاصيل'}</span>
                          <span>&larr;</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Panel */}
                <div className="flex md:flex-col items-end justify-between md:justify-start gap-2 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                  {/* Task controls */}
                  {msg.category === 'task' && msg.taskStatus && (
                    <button
                      onClick={() => handleToggleTaskStatus(msg.id)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer ${
                        msg.taskStatus === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                      }`}
                    >
                      {msg.taskStatus === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      <span>{msg.taskStatus === 'completed' ? t('task_complete') : t('task_pending')}</span>
                    </button>
                  )}

                  <div className="flex gap-2">
                    {/* Mark read button */}
                    <button
                      onClick={() => handleToggleRead(msg.id)}
                      className={`p-2 rounded-lg border transition-colors flex items-center gap-1 text-[10px] font-extrabold cursor-pointer ${
                        msg.isRead 
                          ? 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                      }`}
                      title={msg.isRead ? t('mark_unread') : t('mark_read')}
                    >
                      <Check className={`w-3.5 h-3.5 ${msg.isRead ? 'text-slate-400' : 'text-indigo-600 font-bold'}`} />
                      <span className="hidden sm:inline">{msg.isRead ? t('mark_unread') : t('mark_read')}</span>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent rounded-lg transition-colors cursor-pointer"
                      title={t('delete_msg')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
