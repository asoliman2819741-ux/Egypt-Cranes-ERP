import React, { useState } from 'react';
import { User, Role } from '../types';
import { 
  Plus, Search, Filter, UserCheck, UserX, Edit, Trash2, X, Mail, ShieldAlert, BadgeInfo 
} from 'lucide-react';

export default function Users({
  users,
  onUpdateUsers,
  roles
}: {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
  roles: Role[];
}) {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = users.filter(u => {
    const s = search.toLowerCase();
    const matchesSearch = 
      u.fullName.toLowerCase().includes(s) || 
      u.username.toLowerCase().includes(s) || 
      u.email.toLowerCase().includes(s) ||
      u.jobTitle.toLowerCase().includes(s);
    const matchesRole = filterRole === 'all' || u.roleId === filterRole;
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? u.isActive : !u.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const toggleStatus = (id: string) => {
    const updated = users.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u);
    onUpdateUsers(updated);
  };

  const deleteUser = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم نهائياً من النظام؟')) {
      const updated = users.filter(u => u.id !== id);
      onUpdateUsers(updated);
    }
  };

  // User form modal component
  const UserForm = () => {
    const [form, setForm] = useState<Partial<User>>(editingUser || {
      username: '',
      fullName: '',
      email: '',
      phone: '',
      department: '',
      jobTitle: '',
      roleId: '',
      isActive: true
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const selectedRole = roles.find(r => r.id === form.roleId);
      const roleName = selectedRole ? selectedRole.nameAr : 'مستخدم';

      if (editingUser) {
        const updated = users.map(u => u.id === editingUser.id ? { 
          ...u, 
          ...form,
          roleName
        } as User : u);
        onUpdateUsers(updated);
      } else {
        const newUser: User = {
          id: `usr-${Math.random().toString(36).substr(2, 9)}`,
          username: form.username || '',
          fullName: form.fullName || '',
          email: form.email || '',
          phone: form.phone || '',
          department: form.department || '',
          jobTitle: form.jobTitle || '',
          roleId: form.roleId || '',
          roleName,
          isActive: form.isActive !== undefined ? form.isActive : true,
          createdAt: new Date().toISOString().split('T')[0]
        };
        onUpdateUsers([newUser, ...users]);
      }
      setShowForm(false);
      setEditingUser(null);
    };

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-100 animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-lg font-black text-[#0F4C81] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#F7941D]" />
              {editingUser ? 'تعديل بيانات حساب المستخدم' : 'إنشاء حساب مستخدم جديد'}
            </h2>
            <button 
              onClick={() => { setShowForm(false); setEditingUser(null); }} 
              className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">اسم المستخدم (بالإنجليزي)</label>
                <input 
                  required 
                  type="text"
                  placeholder="e.g. m.ali"
                  value={form.username} 
                  onChange={e => setForm({ ...form, username: e.target.value })} 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">الاسم الكامل (بالعربية)</label>
                <input 
                  required 
                  type="text"
                  placeholder="مثال: محمود علي حسن"
                  value={form.fullName} 
                  onChange={e => setForm({ ...form, fullName: e.target.value })} 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">البريد الإلكتروني المهني</label>
              <input 
                required
                type="email" 
                placeholder="e.g. user@egyptcranes.com"
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })} 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">رقم الجوال</label>
                <input 
                  type="text"
                  placeholder="مثال: 010xxxxxxxx"
                  value={form.phone} 
                  onChange={e => setForm({ ...form, phone: e.target.value })} 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">الدور وصلاحيات الوصول</label>
                <select 
                  required 
                  value={form.roleId} 
                  onChange={e => setForm({ ...form, roleId: e.target.value })} 
                  className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] font-bold text-slate-700"
                >
                  <option value="">اختر الدور الوظيفي...</option>
                  {roles.filter(r => r.isActive).map(r => (
                    <option key={r.id} value={r.id}>{r.nameAr}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">القسم الإداري</label>
                <input 
                  type="text"
                  placeholder="مثال: المالية"
                  value={form.department} 
                  onChange={e => setForm({ ...form, department: e.target.value })} 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">المسمى الوظيفي الفعلي</label>
                <input 
                  type="text"
                  placeholder="مثال: محاسب أصول أول"
                  value={form.jobTitle} 
                  onChange={e => setForm({ ...form, jobTitle: e.target.value })} 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" 
                />
              </div>
            </div>

            <label className="flex items-center gap-3 p-3.5 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <input 
                type="checkbox" 
                checked={form.isActive} 
                onChange={e => setForm({ ...form, isActive: e.target.checked })} 
                className="w-4 h-4 text-[#0F4C81] border-slate-300 rounded-lg focus:ring-[#0F4C81]" 
              />
              <div>
                <span className="block text-xs font-bold text-slate-700">تنشيط حساب المستخدم فوراً</span>
                <span className="block text-[10px] text-slate-400">يمكن للمستخدم تسجيل الدخول واستخدام النظام</span>
              </div>
            </label>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button 
                type="submit" 
                className="flex-1 px-4 py-2.5 bg-[#0F4C81] text-white rounded-xl hover:bg-blue-800 font-extrabold text-xs transition-colors shadow-sm"
              >
                {editingUser ? 'حفظ التعديلات' : 'إنشاء الحساب والمزامنة'}
              </button>
              <button 
                type="button" 
                onClick={() => { setShowForm(false); setEditingUser(null); }} 
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
          <h1 className="text-xl font-black text-slate-800">إدارة حسابات المستخدمين والمسؤولين</h1>
          <p className="text-xs text-slate-400 mt-1">إنشاء ومتابعة حسابات الموظفين وتوزيع الأدوار والصلاحيات على النظام</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setShowForm(true); }} 
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F4C81] text-white rounded-xl hover:bg-blue-800 transition-all text-xs font-bold shadow-md shadow-blue-900/10"
        >
          <Plus className="w-4 h-4" /> مستخدم جديد
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي حسابات المستخدمين', value: users.length, color: 'bg-blue-50/50 border-blue-100/50 text-[#0F4C81]' },
          { label: 'الحسابات النشطة حالياً', value: users.filter(u => u.isActive).length, color: 'bg-emerald-50/50 border-emerald-100/50 text-emerald-700' },
          { label: 'حسابات موقوفة مؤقتاً', value: users.filter(u => !u.isActive).length, color: 'bg-slate-100/50 border-slate-200/50 text-slate-600' },
          { label: 'مسؤولو النظام (Admins)', value: users.filter(u => u.roleId === '1').length, color: 'bg-amber-50/50 border-amber-100/50 text-amber-700' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.color} rounded-2xl p-4 border bg-white shadow-sm`}>
            <p className="text-[10px] font-bold uppercase opacity-80">{stat.label}</p>
            <p className="text-2xl font-black mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="البحث بالاسم، البريد الإلكتروني، اسم المستخدم، المسمى الوظيفي..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full pr-11 pl-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C81] placeholder-slate-400" 
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl font-bold text-xs transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-[#0F4C81]' : 'hover:bg-slate-50 border-slate-200 text-slate-600'}`}
          >
            <Filter className="w-3.5 h-3.5" /> تصفية متقدمة
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">تصفية حسب الدور</label>
              <select 
                value={filterRole} 
                onChange={e => setFilterRole(e.target.value)} 
                className="px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C81] text-slate-600 font-bold"
              >
                <option value="all">جميع الأدوار</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.nameAr}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">تصفية حسب حالة الحساب</label>
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)} 
                className="px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C81] text-slate-600 font-bold"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500">المستخدم والموظف</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 text-center">الدور وتصريح الدخول</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 text-center">القسم الإداري</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 text-center">حالة الحساب</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 text-center">تاريخ الإنشاء</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 text-center">العمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/40 border border-blue-100 flex items-center justify-center text-[#0F4C81] font-black text-sm">
                        {user.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-800 text-sm">{user.fullName}</p>
                        <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <span className="text-slate-500">@{user.username}</span>
                          <span className="text-slate-300">•</span>
                          <span>{user.email}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                      user.roleId === '1' 
                        ? 'bg-purple-50 text-purple-700 border-purple-100' 
                        : user.roleId === '2'
                          ? 'bg-blue-50 text-blue-700 border-blue-100'
                          : 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {user.roleName}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-xs font-extrabold text-slate-600">
                    {user.department || '—'}
                    {user.jobTitle && <span className="block text-[10px] text-slate-400 font-normal">{user.jobTitle}</span>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => toggleStatus(user.id)} 
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-colors ${
                        user.isActive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100'
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>نشط</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-3.5 h-3.5" />
                          <span>موقوف</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center text-xs font-bold text-slate-400 font-mono">
                    {user.createdAt}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => { setEditingUser(user); setShowForm(true); }} 
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="تعديل حساب المستخدم"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteUser(user.id)} 
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="حذف المستخدم"
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

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-400">لا يوجد حسابات مستخدمين مطابقة لخيارات البحث المحددة</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-50 border border-slate-100/60 rounded-2xl flex items-center gap-2">
        <BadgeInfo className="w-4 h-4 text-[#0F4C81] flex-shrink-0" />
        <span className="text-[10px] text-slate-500 font-bold">
          ملاحظة للمشرف: إيقاف حساب المستخدم سيمنعه فوراً من الوصول للنظام وسينقله لحالة الموقوفين دون حذف بياناته المحاسبية المسجلة سابقاً.
        </span>
      </div>

      {showForm && <UserForm />}
    </div>
  );
}
