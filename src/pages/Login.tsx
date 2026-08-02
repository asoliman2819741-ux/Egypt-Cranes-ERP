import React, { useState } from 'react';
import { Key, User as UserIcon, Building2, AlertCircle } from 'lucide-react';
import { User } from '../types';
import { initialUsers } from '../mockData';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (username.trim() && password.trim()) {
        const foundUser = initialUsers.find(
          u => u.username === username.trim().toLowerCase()
        ) || initialUsers[0];
        onLoginSuccess(foundUser);
      } else {
        setError('يرجى إدخال اسم المستخدم وكلمة المرور بشكل صحيح');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 md:p-8 dir-rtl text-right font-sans transition-colors">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
        
        {/* Visual Brand Panel */}
        <div className="hidden md:flex md:col-span-6 bg-slate-900 relative flex-col justify-between p-8 text-white overflow-hidden">
          {/* Background image with overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-65 scale-105 transition-all duration-700 hover:scale-100"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1200&auto=format&fit=crop')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-900/20" />
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F7941D] flex items-center justify-center font-bold text-lg text-slate-950 shadow-md">
              EC
            </div>
            <div>
              <span className="font-bold text-lg tracking-wide block">EGYPT CRANES</span>
              <span className="text-xs text-slate-300">مجموعة إيجيبت كرينز لخدمات الرفع الثقيل</span>
            </div>
          </div>

          <div className="relative z-10 space-y-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
              بوابة إدارية متكاملة للرفع والتشغيل الثقيل
            </h1>
            <p className="text-sm text-slate-200 font-light max-w-md">
              نظام تخطيط موارد المؤسسة (ERP) الرقمي لإدارة الأساطيل، لوحة التحكم بالبوابة الأمنية، حسابات المشاريع ومراكز التكلفة وحضور العاملين بنظام المزامنة الذاتية.
            </p>
          </div>

          <div className="relative z-10 text-xs text-slate-400">
            © {new Date().getFullYear()} شركة إيجيبت كرينز. جميع الحقوق محفوظة.
          </div>
        </div>

        {/* Form Panel */}
        <div className="col-span-1 md:col-span-6 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <div className="md:hidden flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#F7941D] flex items-center justify-center font-bold text-sm text-slate-950">
                EC
              </div>
              <span className="font-bold text-slate-900">EGYPT CRANES</span>
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">تسجيل الدخول للنظام</h2>
            <p className="text-slate-500 text-sm">أدخل بيانات اعتمادك للوصول إلى لوحة التحكم الموحدة</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">اسم المستخدم</label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <UserIcon className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثال: admin"
                  className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:border-[#0F4C81] transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">كلمة المرور</label>
                <a href="#forgot" className="text-xs text-[#0F4C81] hover:underline font-medium">نسيت كلمة المرور؟</a>
              </div>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Key className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:border-[#0F4C81] transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input 
                id="remember_me" 
                type="checkbox" 
                defaultChecked 
                className="w-4 h-4 text-[#0F4C81] border-slate-300 rounded focus:ring-[#0F4C81]" 
              />
              <label htmlFor="remember_me" className="text-xs text-slate-600 cursor-pointer select-none">
                تذكر تسجيل دخولي في هذه الجلسة
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#0F4C81] text-white font-semibold rounded-xl hover:bg-[#0c3d67] focus:outline-none focus:ring-2 focus:ring-[#0f4c81]/50 transition-colors shadow-lg shadow-blue-900/10 text-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-75"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'تسجيل الدخول للمنصة'
              )}
            </button>
          </form>

          {/* Quick Admin Helper */}
          <div className="mt-8 p-4 bg-amber-50/50 border border-amber-100/60 rounded-xl text-xs text-slate-600">
            <span className="font-bold text-amber-800 block mb-1">دليل الوصول السريع للواجهة الاستعراضية:</span>
            يمكنك تسجيل الدخول مباشرة باستخدام أي اسم مستخدم وكلمة مرور (الافتراضي: <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-mono">admin</code> / <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-mono">admin123</code>).
          </div>
        </div>
      </div>
    </div>
  );
}
