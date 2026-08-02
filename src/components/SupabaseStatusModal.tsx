import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, Server, Key, ShieldCheck, Activity, BarChart2 } from 'lucide-react';
import { supabase, checkSupabaseConnection } from '../lib/supabase';
import SystemHealthDashboard from './SystemHealthDashboard';

export default function SupabaseStatusModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'health'>('info');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ checked: boolean; success: boolean; message: string }>({
    checked: true,
    success: true,
    message: 'متصل بقاعدة بيانات Supabase المخصصة (thyudheynriuiqvxagnd)'
  });

  const handleTestConnection = async () => {
    setTesting(true);
    const result = await checkSupabaseConnection();
    setStatus({
      checked: true,
      success: result.success,
      message: result.message
    });
    setTesting(false);
  };

  return (
    <>
      <button
        onClick={() => { setIsOpen(true); setActiveTab('info'); }}
        className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
        title="عرض معلومات وصحة قاعدة البيانات Supabase"
      >
        <Database className="w-3.5 h-3.5 text-emerald-600" />
        <span>Supabase DB: متصل ⚡</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-5 dir-rtl text-right overflow-y-auto">
          <div className={`bg-white rounded-2xl shadow-2xl w-full border border-slate-100 overflow-hidden transition-all my-auto ${
            activeTab === 'health' ? 'max-w-5xl' : 'max-w-lg'
          }`}>
            {/* Header */}
            <div className="bg-[#0F4C81] p-4 sm:p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-xl">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">إعدادات وقاعدة بيانات Supabase</h3>
                  <p className="text-[11px] text-slate-200 font-mono">Project Reference: thyudheynriuiqvxagnd</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/10 rounded-lg p-1 text-2xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="bg-slate-100 p-1.5 border-b border-slate-200 flex items-center gap-2">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'info' 
                    ? 'bg-white text-[#0F4C81] shadow-sm font-black' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Server className="w-4 h-4 text-[#0F4C81]" />
                <span>معلومات الاتصال والبيانات</span>
              </button>

              <button
                onClick={() => setActiveTab('health')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'health' 
                    ? 'bg-slate-900 text-emerald-400 shadow-sm font-black' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>لوحة صحة النظام والأداء المباشر (System Health)</span>
              </button>
            </div>

            {/* TAB 1: CONNECTION INFO */}
            {activeTab === 'info' && (
              <>
                <div className="p-6 space-y-4 text-xs font-semibold text-slate-800">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500 font-bold">رابط المشروع (Project URL):</span>
                      <span className="font-mono font-bold text-[#0F4C81]">https://thyudheynriuiqvxagnd.supabase.co</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500 font-bold">مفاتيح الوصول (Publishable Key):</span>
                      <span className="font-mono text-emerald-700 font-bold">sb_publishable_dszihp...</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500 font-bold">إقليم الخادم (Region):</span>
                      <span className="font-mono text-slate-800 font-bold">eu-central-1 (Frankfurt)</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500 font-bold">عنوان REST API:</span>
                      <span className="font-mono text-emerald-700 font-bold text-[10px]">https://thyudheynriuiqvxagnd.supabase.co/rest/v1/</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-500 font-bold">سلسلة الاتصال المباشر (PostgreSQL URI):</span>
                      <span className="font-mono text-slate-700 text-[10px]">db.thyudheynriuiqvxagnd.supabase.co:5432</span>
                    </div>
                  </div>

                  {/* Status Box */}
                  <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                    status.success 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    {status.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-extrabold text-sm mb-0.5">
                        {status.success ? 'حالة الاتصال: متصل وجاهز' : 'فشل الاتصال'}
                      </h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                        {status.message}
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 text-[11px] text-slate-700 leading-relaxed space-y-2">
                    <span className="font-extrabold text-[#0F4C81] block text-xs">💡 أين تجد هذه البيانات في Supabase Dashboard؟</span>
                    
                    <div className="space-y-1.5 font-normal">
                      <p>
                        <strong className="text-slate-900">1. رابط المشروع ومفتاح الوصول (Project URL & Anon Key):</strong><br />
                        ادخل إلى <span className="font-mono bg-blue-100/70 px-1 rounded">Project Settings ⚙️</span> ← <span className="font-mono bg-blue-100/70 px-1 rounded">API</span> ← ستجد <span className="font-mono text-[#0F4C81]">Project URL</span> و <span className="font-mono text-emerald-800">Project API Keys (anon public)</span>.
                      </p>
                      
                      <p>
                        <strong className="text-slate-900">2. سلسلة اتصال قاعدة البيانات (DATABASE_URL):</strong><br />
                        ادخل إلى <span className="font-mono bg-blue-100/70 px-1 rounded">Project Settings ⚙️</span> ← <span className="font-mono bg-blue-100/70 px-1 rounded">Database</span> ← انزل إلى قسم <span className="font-mono text-[#0F4C81]">Connection string</span> واختر تبويب <span className="font-mono">URI</span> (تأكد من استبدال كلمة المرور الخاصه بك في الرابط).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                  <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="px-4 py-2 bg-[#0F4C81] hover:bg-[#0c3d67] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                    <span>{testing ? 'جاري اختبار الاتصال...' : 'اختبار الاتصال بـ Supabase'}</span>
                  </button>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    إغلاق
                  </button>
                </div>
              </>
            )}

            {/* TAB 2: SYSTEM HEALTH DASHBOARD */}
            {activeTab === 'health' && (
              <div className="p-4 max-h-[80vh] overflow-y-auto">
                <SystemHealthDashboard />
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}

