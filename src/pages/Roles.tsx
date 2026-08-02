import React, { useState } from 'react';
import { Role, ScreenModule } from '../types';
import { 
  Shield, Plus, ChevronRight, ChevronLeft, Save, Edit, Trash2, Users, Key, CheckSquare, Square, X 
} from 'lucide-react';

export default function Roles({
  roles,
  onUpdateRoles,
  screens,
  permissions: propPermissions,
  onUpdatePermissions
}: {
  roles: Role[];
  onUpdateRoles: (roles: Role[]) => void;
  screens: ScreenModule[];
  permissions?: Record<string, Record<string, Record<string, boolean>>>;
  onUpdatePermissions?: (perms: Record<string, Record<string, Record<string, boolean>>>) => void;
}) {
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  
  // Local permissions fallback state
  const [localPermissions, setLocalPermissions] = useState<Record<string, Record<string, Record<string, boolean>>>>({
    '1': screens.reduce((acc, screen) => {
      acc[screen.id] = { view: true, create: true, edit: true, delete: true, print: true, export: true, import: true, approve: true };
      return acc;
    }, {} as Record<string, Record<string, boolean>>),
    '2': screens.reduce((acc, screen) => {
      const isFinance = screen.module.includes('مالية') || screen.module.includes('محاسب');
      acc[screen.id] = { 
        view: true, 
        create: isFinance, 
        edit: isFinance, 
        delete: false, 
        print: true, 
        export: true, 
        import: isFinance, 
        approve: false 
      };
      return acc;
    }, {} as Record<string, Record<string, boolean>>),
  });

  const permissions = propPermissions || localPermissions;
  const setPermissions = onUpdatePermissions || setLocalPermissions;

  const actions = ['view', 'create', 'edit', 'delete', 'print', 'export', 'import', 'approve'];
  const actionLabels: Record<string, string> = { 
    view: 'عرض', 
    create: 'إنشاء', 
    edit: 'تعديل', 
    delete: 'حذف', 
    print: 'طباعة', 
    export: 'تصدير', 
    import: 'استيراد', 
    approve: 'اعتماد' 
  };

  const togglePermission = (screenId: string, action: string) => {
    if (!activeRoleId) return;
    setPermissions(prev => {
      const rolePerms = prev[activeRoleId] || {};
      const screenPerms = rolePerms[screenId] || {};
      return {
        ...prev,
        [activeRoleId]: {
          ...rolePerms,
          [screenId]: {
            ...screenPerms,
            [action]: !screenPerms[action]
          }
        }
      };
    });
  };

  const RoleForm = () => {
    const [form, setForm] = useState<Partial<Role>>(editingRole || {
      name: '',
      nameAr: '',
      description: '',
      isActive: true
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingRole) {
        const updated = roles.map(r => r.id === editingRole.id ? { ...r, ...form } as Role : r);
        onUpdateRoles(updated);
      } else {
        const newRole: Role = {
          id: `role-${Math.random().toString(36).substr(2, 9)}`,
          name: form.name || '',
          nameAr: form.nameAr || '',
          description: form.description || '',
          isSystem: false,
          isActive: form.isActive !== undefined ? form.isActive : true,
          userCount: 0
        };
        onUpdateRoles([...roles, newRole]);
      }
      setShowForm(false);
      setEditingRole(null);
    };

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-100 animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-lg font-black text-[#0F4C81] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#F7941D]" />
              {editingRole ? 'تعديل مسمى ووصف الدور' : 'إنشاء دور وصلاحية جديدة'}
            </h2>
            <button 
              onClick={() => { setShowForm(false); setEditingRole(null); }} 
              className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">الاسم الوظيفي (إنجليزي)</label>
                <input 
                  required 
                  placeholder="e.g. Procurement Officer"
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">مسمى الصلاحية (عربي)</label>
                <input 
                  required 
                  placeholder="مثال: مسؤول مشتريات"
                  value={form.nameAr} 
                  onChange={e => setForm({ ...form, nameAr: e.target.value })} 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">الوصف التفصيلي للمهام والصلاحيات</label>
              <textarea 
                value={form.description} 
                onChange={e => setForm({ ...form, description: e.target.value })} 
                rows={3} 
                placeholder="صف حدود الصلاحية للتحكم بالوصول..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] resize-none" 
              />
            </div>
            <label className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <input 
                type="checkbox" 
                checked={form.isActive} 
                onChange={e => setForm({ ...form, isActive: e.target.checked })} 
                className="w-4 h-4 text-[#0F4C81] rounded-lg border-slate-300" 
              />
              <div>
                <span className="block text-xs font-bold text-slate-700">هذا الدور نشط ومتاح حالياً</span>
                <span className="block text-[10px] text-slate-400">يمكن ربط المستخدمين بهذا الدور فور تفعيله</span>
              </div>
            </label>
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button 
                type="submit" 
                className="flex-1 px-4 py-2.5 bg-[#0F4C81] text-white rounded-xl hover:bg-blue-800 font-extrabold text-xs transition-colors shadow-sm"
              >
                {editingRole ? 'تحديث الدور' : 'إنشاء وتفعيل الدور'}
              </button>
              <button 
                type="button" 
                onClick={() => { setShowForm(false); setEditingRole(null); }} 
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

  if (activeRoleId) {
    const role = roles.find(r => r.id === activeRoleId);
    const modules = Array.from(new Set(screens.map(s => s.module)));
    
    return (
      <div className="p-6 space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveRoleId(null)} 
            className="p-2 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-slate-600"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800">
              صلاحيات الوصول للدور: <span className="text-[#0F4C81] font-black">{role?.nameAr}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">تحديد الإجراءات المسموح بها للموظف على مستوى كل واجهة موديول في النظام</p>
          </div>
        </div>

        <div className="space-y-6">
          {modules.map(moduleName => {
            const moduleScreens = screens.filter(s => s.module === moduleName);
            return (
              <div key={moduleName} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                  <h3 className="font-extrabold text-xs text-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F7941D]" />
                    {moduleName}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-6 py-3 text-xs font-bold text-slate-400">الشاشة الفرعية</th>
                        {actions.map(a => (
                          <th key={a} className="px-4 py-3 text-center text-xs font-bold text-slate-400">
                            {actionLabels[a]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {moduleScreens.map(screen => {
                        const screenPerms = permissions[activeRoleId]?.[screen.id] || {};
                        return (
                          <tr key={screen.id} className="hover:bg-slate-50/40">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-bold text-slate-800 text-xs">{screen.nameAr}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{screen.name}</p>
                              </div>
                            </td>
                            {actions.map(action => {
                              const hasPerm = !!screenPerms[action];
                              return (
                                <td key={action} className="px-4 py-4 text-center">
                                  <button 
                                    onClick={() => togglePermission(screen.id, action)} 
                                    className="inline-flex items-center justify-center p-1 hover:bg-slate-100 rounded-lg transition-colors"
                                  >
                                    {hasPerm ? (
                                      <CheckSquare className="w-5 h-5 text-[#0F4C81]" />
                                    ) : (
                                      <Square className="w-5 h-5 text-slate-300" />
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button 
            onClick={() => { alert('تم تحديث وحفظ مصفوفة الصلاحيات بنجاح للمخدم السحابي!'); setActiveRoleId(null); }} 
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F4C81] text-white rounded-xl hover:bg-blue-800 font-black text-xs transition-colors shadow-md shadow-blue-900/10"
          >
            <Save className="w-4 h-4" /> حفظ وإلزام الموظفين
          </button>
          <button 
            onClick={() => setActiveRoleId(null)} 
            className="px-5 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 font-bold text-xs"
          >
            رجوع
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800">الأدوار وصلاحيات مجموعات الموظفين</h1>
          <p className="text-xs text-slate-400 mt-1">تحديد مجموعات التراخيص والمسميات الوظيفية للتحكم في شاشات الإدخال والتعديل</p>
        </div>
        <button 
          onClick={() => { setEditingRole(null); setShowForm(true); }} 
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F4C81] text-white rounded-xl hover:bg-blue-800 transition-all text-xs font-bold shadow-md shadow-blue-900/10"
        >
          <Plus className="w-4 h-4" /> دور جديد
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map(role => (
          <div 
            key={role.id} 
            className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow relative flex flex-col justify-between ${
              !role.isActive ? 'opacity-70' : ''
            }`}
          >
            {/* Top Indicator Strip */}
            <div className={`h-1.5 ${role.isSystem ? 'bg-purple-500' : role.isActive ? 'bg-[#0F4C81]' : 'bg-slate-300'}`} />
            
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${role.isSystem ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-[#0F4C81]'}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    {!role.isSystem && (
                      <>
                        <button 
                          onClick={() => { setEditingRole(role); setShowForm(true); }} 
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-amber-600 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { 
                            if (confirm('هل أنت متأكد من حذف هذا الدور نهائياً؟')) {
                              onUpdateRoles(roles.filter(r => r.id !== role.id));
                            }
                          }} 
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="font-extrabold text-sm text-slate-800 leading-tight">{role.nameAr}</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{role.name}</p>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 h-8 leading-relaxed">
                    {role.description || 'لم يتم كتابة وصف مخصص لهذا الدور'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 space-y-4">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{role.userCount || 0} مستخدم مربوط</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] ${
                    role.isSystem 
                      ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                      : role.isActive 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {role.isSystem ? 'رئيسي للنظام' : role.isActive ? 'مفعل' : 'معطل'}
                  </span>
                </div>

                <button 
                  onClick={() => setActiveRoleId(role.id)} 
                  className="flex items-center justify-center gap-2 w-full py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors text-slate-700"
                >
                  <Key className="w-3.5 h-3.5 text-slate-400" /> 
                  <span>تعديل مصفوفة الصلاحيات</span>
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && <RoleForm />}
    </div>
  );
}
