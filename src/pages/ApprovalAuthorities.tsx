import React, { useState } from 'react';
import { ApprovalAuthority, User, ScreenModule } from '../types';
import { 
  Plus, Search, ChevronUp, ChevronDown, ShieldCheck, XCircle, Edit, Trash2, Monitor, AlertTriangle, X, DollarSign, CheckCircle 
} from 'lucide-react';

export default function ApprovalAuthorities({
  authorities,
  onUpdateAuthorities,
  users,
  screens
}: {
  authorities: ApprovalAuthority[];
  onUpdateAuthorities: (authorities: ApprovalAuthority[]) => void;
  users: User[];
  screens: ScreenModule[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const filtered = authorities.filter(a => 
    a.userName.toLowerCase().includes(search.toLowerCase()) ||
    a.screenName.toLowerCase().includes(search.toLowerCase())
  );

  // Group authorities by user name
  const grouped = filtered.reduce((acc, a) => {
    if (!acc[a.userName]) acc[a.userName] = [];
    acc[a.userName].push(a);
    return acc;
  }, {} as Record<string, ApprovalAuthority[]>);

  const toggleAuth = (id: string) => {
    const updated = authorities.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a);
    onUpdateAuthorities(updated);
  };

  const deleteAuth = (id: string) => {
    if (confirm('هل أنت متأكد من إلغاء وتجريد صلاحية الاعتماد هذه نهائياً؟')) {
      const updated = authorities.filter(a => a.id !== id);
      onUpdateAuthorities(updated);
    }
  };

  // Add Authority Form Modal
  const AuthorityForm = () => {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedScreenId, setSelectedScreenId] = useState('');
    const [canApproveSave, setCanApproveSave] = useState(true);
    const [canApproveEdit, setCanApproveEdit] = useState(false);
    const [canApproveDelete, setCanApproveDelete] = useState(false);
    const [approvalLimit, setApprovalLimit] = useState('');
    const [isActive, setIsActive] = useState(true);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const targetUser = users.find(u => u.id === selectedUserId);
      const targetScreen = screens.find(s => s.id === selectedScreenId);

      if (!targetUser || !targetScreen) {
        alert('يرجى ملء جميع الحقول المطلوبة بشكل صحيح.');
        return;
      }

      const newAuth: ApprovalAuthority = {
        id: `auth-${Math.random().toString(36).substr(2, 9)}`,
        userName: targetUser.fullName,
        screenName: targetScreen.nameAr,
        canApproveSave,
        canApproveEdit,
        canApproveDelete,
        approvalLimit: approvalLimit ? Number(approvalLimit) : undefined,
        isActive
      };

      onUpdateAuthorities([newAuth, ...authorities]);
      setShowForm(false);
    };

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-100 animate-in zoom-in duration-200">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-lg font-black text-[#0F4C81] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#F7941D]" />
              منح صلاحيات وتراخيص الاعتماد المالي والتقني
            </h2>
            <button 
              onClick={() => setShowForm(false)} 
              className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* User Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">اختر مستخدم لمنحه صلاحية الاعتماد</label>
              <select
                required
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] font-bold text-slate-700"
              >
                <option value="">اختر المستخدم...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.fullName} - {u.jobTitle} ({u.department})</option>
                ))}
              </select>
            </div>

            {/* Screen Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">اختر الشاشة الفرعية / الموديول المسموح به</label>
              <select
                required
                value={selectedScreenId}
                onChange={e => setSelectedScreenId(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] font-bold text-slate-700"
              >
                <option value="">اختر الشاشة...</option>
                {screens.map(s => (
                  <option key={s.id} value={s.id}>{s.nameAr} - ({s.module})</option>
                ))}
              </select>
            </div>

            {/* Authority Actions Options */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-2.5">
              <h4 className="text-[11px] font-black text-slate-500 mb-2">الإجراءات المسموح له باعتمادها:</h4>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 bg-white px-3 py-2 border rounded-xl cursor-pointer hover:bg-slate-50">
                  <input 
                    type="checkbox" 
                    checked={canApproveSave} 
                    onChange={e => setCanApproveSave(e.target.checked)} 
                    className="text-[#0F4C81] focus:ring-[#0F4C81] rounded w-4 h-4" 
                  />
                  <span className="text-xs font-bold text-slate-700">طلب حفظ</span>
                </label>
                <label className="flex items-center gap-2 bg-white px-3 py-2 border rounded-xl cursor-pointer hover:bg-slate-50">
                  <input 
                    type="checkbox" 
                    checked={canApproveEdit} 
                    onChange={e => setCanApproveEdit(e.target.checked)} 
                    className="text-[#0F4C81] focus:ring-[#0F4C81] rounded w-4 h-4" 
                  />
                  <span className="text-xs font-bold text-slate-700">طلب تعديل</span>
                </label>
                <label className="flex items-center gap-2 bg-white px-3 py-2 border rounded-xl cursor-pointer hover:bg-slate-50">
                  <input 
                    type="checkbox" 
                    checked={canApproveDelete} 
                    onChange={e => setCanApproveDelete(e.target.checked)} 
                    className="text-[#0F4C81] focus:ring-[#0F4C81] rounded w-4 h-4" 
                  />
                  <span className="text-xs font-bold text-slate-700">طلب حذف</span>
                </label>
              </div>
            </div>

            {/* Financial Limit Input */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                الحد المالي الأقصى المسموح باعتماده (ج.م)
              </label>
              <input 
                type="number"
                placeholder="مثال: 500000 (اتركه فارغاً ليكون غير محدود)"
                value={approvalLimit}
                onChange={e => setApprovalLimit(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" 
              />
              <span className="block text-[10px] text-slate-400 mt-1">أي مستند يتجاوز هذا الحد سيتطلب ترقية الطلب لمسؤول أعلى</span>
            </div>

            {/* Is Active Toggle */}
            <label className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <input 
                type="checkbox" 
                checked={isActive} 
                onChange={e => setIsActive(e.target.checked)} 
                className="w-4 h-4 text-[#0F4C81] border-slate-300 rounded-lg" 
              />
              <div>
                <span className="block text-xs font-bold text-slate-700">صلاحية الاعتماد نشطة الآن</span>
                <span className="block text-[10px] text-slate-400">سيبدأ الموظف باستقبال طلبات الاعتماد الخاصة بهذا الموديول فوراً</span>
              </div>
            </label>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button 
                type="submit" 
                className="flex-1 px-4 py-2.5 bg-[#0F4C81] text-white rounded-xl hover:bg-blue-800 font-extrabold text-xs transition-colors shadow-sm"
              >
                تنشيط الصلاحية
              </button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 font-bold text-xs"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800">قواعد ومسؤوليات صلاحيات الاعتماد</h1>
          <p className="text-xs text-slate-400 mt-1">إعطاء صلاحية اعتماد وحفظ المستندات المالية والتشغيلية وتحديد الأسقف الائتمانية للموظفين</p>
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F4C81] text-white rounded-xl hover:bg-blue-800 transition-all text-xs font-bold shadow-md shadow-blue-900/10"
        >
          <Plus className="w-4 h-4" /> منح صلاحية جديدة
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي التراخيص الممنوحة', value: authorities.length, color: 'bg-blue-50/50 border-blue-100/50 text-[#0F4C81]' },
          { label: 'التراخيص النشطة حالياً', value: authorities.filter(a => a.isActive).length, color: 'bg-emerald-50/50 border-emerald-100/50 text-emerald-700' },
          { label: 'الموظفون المخولون بالاعتماد', value: Object.keys(grouped).length, color: 'bg-purple-50/50 border-purple-100/50 text-purple-700' },
          { label: 'الموديولات المغطاة بقواعد الاعتماد', value: Array.from(new Set(authorities.map(a => a.screenName))).length, color: 'bg-amber-50/50 border-amber-100/50 text-amber-700' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.color} rounded-2xl p-4 border bg-white shadow-sm`}>
            <p className="text-[10px] font-bold uppercase opacity-80">{stat.label}</p>
            <p className="text-2xl font-black mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="البحث باسم الموظف المعتمد أو الموديول..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full pr-11 pl-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" 
          />
        </div>
      </div>

      {/* Grouped Authorities List */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([userName, userAuths]) => {
          const isExpanded = expandedUser === userName;
          const activeCount = userAuths.filter(a => a.isActive).length;
          return (
            <div key={userName} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all">
              <button 
                onClick={() => setExpandedUser(isExpanded ? null : userName)} 
                className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors text-right"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#0F4C81]/5 text-[#0F4C81] border border-[#0F4C81]/10 flex items-center justify-center font-black text-base">
                    {userName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800">{userName}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">عدد الموديولات المرخص له اعتمادها: {userAuths.length} موديول</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-bold ${activeCount > 0 ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {activeCount} نشط
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>
              
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/20">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead className="bg-slate-50/70 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-3 text-xs font-bold text-slate-500">الشاشة أو موديول العمليات</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">الحفظ (Save)</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">التعديل (Edit)</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">الحذف (Delete)</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">الحد الائتماني للمستند</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">الحالة والقواعد</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">تعديل وصرف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {userAuths.map(auth => (
                          <tr key={auth.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Monitor className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-extrabold text-slate-800">{auth.screenName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              {auth.canApproveSave ? (
                                <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                              ) : (
                                <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                              )}
                            </td>
                            <td className="px-4 py-4 text-center">
                              {auth.canApproveEdit ? (
                                <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                              ) : (
                                <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                              )}
                            </td>
                            <td className="px-4 py-4 text-center">
                              {auth.canApproveDelete ? (
                                <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                              ) : (
                                <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                              )}
                            </td>
                            <td className="px-4 py-4 text-center text-xs font-black text-slate-700">
                              {auth.approvalLimit ? `${auth.approvalLimit.toLocaleString()} ج.م` : 'غير محدود (صلاحية قصوى)'}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <button 
                                onClick={() => toggleAuth(auth.id)} 
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[9px] font-bold border transition-colors ${
                                  auth.isActive 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
                                    : 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100'
                                }`}
                              >
                                <span>{auth.isActive ? 'مفعلة' : 'موقوفة'}</span>
                              </button>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button 
                                  onClick={() => deleteAuth(auth.id)} 
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="إلغاء الترخيص"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-500 shadow-sm">
            <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-400">لا يوجد تراخيص اعتماد ومسؤولية مطابقة لخيارات البحث</p>
          </div>
        )}
      </div>

      {showForm && <AuthorityForm />}
    </div>
  );
}
