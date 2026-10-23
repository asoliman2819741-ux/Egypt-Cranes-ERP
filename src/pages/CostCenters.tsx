import React, { useState } from 'react';
import { CostCenter } from '../types';
import { initialCostCenters } from '../mockData';
import { Plus, Search, Building2, User, Target, AlertTriangle, ShieldAlert, Printer } from 'lucide-react';
import ExportPDFButton from '../components/ExportPDFButton';

export default function CostCenters({
  costCenters,
  onAddCostCenter,
  onUpdateCostCenters
}: {
  costCenters?: CostCenter[];
  onAddCostCenter?: (newItem: CostCenter) => void;
  onUpdateCostCenters?: (items: CostCenter[]) => void;
}) {
  const [localCenters, setLocalCenters] = useState<CostCenter[]>(initialCostCenters);
  const centers = costCenters || localCenters;
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [department, setDepartment] = useState('موقع العمليات الخارجي');
  const [budget, setBudget] = useState('');
  const [managerName, setManagerName] = useState('');

  const handleAddCC = (e: React.FormEvent) => {
    e.preventDefault();
    const newCC: CostCenter = {
      id: Math.random().toString(),
      code,
      nameAr,
      nameEn: nameAr,
      department,
      budget: parseFloat(budget) || 0,
      usedBudget: 0,
      isActive: true,
      managerName
    };
    if (onAddCostCenter) {
      onAddCostCenter(newCC);
    } else {
      setLocalCenters([newCC, ...localCenters]);
    }
    setShowAddForm(false);
    // Reset Form
    setCode('');
    setNameAr('');
    setBudget('');
    setManagerName('');
  };

  const filtered = centers.filter(c => 
    c.nameAr.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.managerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 dir-rtl text-right font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">مراكز التكلفة وحسابات المشاريع</h1>
          <p className="text-slate-500 mt-1 text-sm">مراقبة ميزانيات المشاريع، تكاليف تشغيل الأوناش ومصروفات الوقود والعمالة المباشرة</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <ExportPDFButton
            variant="outline"
            titleAr="تصدير تقرير مراكز التكلفة PDF 📄"
            titleEn="Export Cost Centers PDF"
            exportOptions={{
              titleAr: 'تقرير مراكز التكلفة ومشاريع التشغيل - إيجيبت كرينز',
              titleEn: 'Cost Centers & Project Budgets Report - Egypt Cranes',
              subtitleAr: `مراقبة الميزانيات المعتمدة والمصروف الفعلي لعدد (${filtered.length}) مركز تكلفة`,
              filename: 'cost_centers_report',
              columns: [
                { headerAr: 'الرمز', accessor: 'code', align: 'center', width: '90px' },
                { headerAr: 'اسم مركز التكلفة / المشروع', accessor: 'nameAr', align: 'right' },
                { headerAr: 'المسؤول / المشرف', accessor: 'managerName', align: 'center', width: '130px' },
                { headerAr: 'الميزانية المخصصة', accessor: (r: any) => `${Number(r.budget).toLocaleString()} ج.م`, align: 'left', width: '130px' },
                { headerAr: 'المنصرف الفعلي', accessor: (r: any) => `${Number(r.usedBudget).toLocaleString()} ج.م`, align: 'left', width: '130px' },
                { headerAr: 'نسبة الاستهلاك', accessor: (r: any) => `${((r.usedBudget / (r.budget || 1)) * 100).toFixed(1)}%`, align: 'center', width: '110px' }
              ],
              data: filtered,
              summaryItems: [
                { labelAr: 'إجمالي مراكز التكلفة', value: `${filtered.length} مراكز` },
                { labelAr: 'إجمالي الميزانيات المعتمدة', value: `${filtered.reduce((a, b) => a + b.budget, 0).toLocaleString()} ج.م` },
                { labelAr: 'إجمالي المنصرف الفعلي', value: `${filtered.reduce((a, b) => a + b.usedBudget, 0).toLocaleString()} ج.م`, highlight: true },
                { labelAr: 'المتبقي من الميزانيات', value: `${(filtered.reduce((a, b) => a + b.budget, 0) - filtered.reduce((a, b) => a + b.usedBudget, 0)).toLocaleString()} ج.م` }
              ]
            }}
          />
          <button 
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2.5 bg-[#0F4C81] text-white font-bold text-sm rounded-xl hover:bg-[#0c3d67] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-5 h-5" /> إضافة مركز تكلفة جديد
          </button>
        </div>
      </div>

      {/* Search filter */}
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative">
          <input 
            type="text" 
            placeholder="البحث باسم مركز التكلفة، الرمز، أو المهندس المسؤول..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-11 pl-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>
      </div>

      {/* Cost Centers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(center => {
          const usedPct = center.budget > 0 ? (center.usedBudget / center.budget) * 100 : 0;
          const isWarning = usedPct >= 80 && usedPct < 100;
          const isDanger = usedPct >= 100;

          return (
            <div 
              key={center.id} 
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-md ${
                isDanger ? 'border-red-200' : isWarning ? 'border-amber-200' : 'border-slate-100'
              }`}
            >
              {/* Top Banner accent */}
              <div className={`h-1.5 ${
                isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-[#0F4C81]'
              }`} />

              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                      {center.code}
                    </span>
                    <h3 className="font-extrabold text-slate-800 text-base leading-snug pt-1">
                      {center.nameAr}
                    </h3>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isDanger ? 'bg-red-50 text-red-700' : isWarning ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-700'
                  }`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="text-xs text-slate-400 font-medium">
                  القسم الداخلي: {center.department}
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">المصروف الفعلي / الموازنة</span>
                    <span className={`${
                      isDanger ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-[#0F4C81]'
                    }`}>
                      {usedPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-[#0F4C81]'
                      }`}
                      style={{ width: `${Math.min(usedPct, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>{center.usedBudget.toLocaleString()} ج.م</span>
                    <span>{center.budget.toLocaleString()} ج.م</span>
                  </div>
                </div>

                {/* System alerts */}
                {isDanger && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-800 text-xs">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                    <span>تنبيه: تجاوز كامل القيمة المخصصة للمشروع! يرجى مراجعة الإدارة المالية.</span>
                  </div>
                )}
                {isWarning && !isDanger && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2 text-amber-800 text-xs">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                    <span>تنبيه: استهلاك الموازنة تخطى 80% من الميزانية المعتمدة.</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>المدير: {center.managerName}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full font-bold ${
                  center.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-500'
                }`}>
                  {center.isActive ? 'نشط' : 'مغلق'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden text-right">
            <div className="bg-[#0F4C81] p-6 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg">إضافة مركز تكلفة مالي جديد</h3>
              <button 
                onClick={() => setShowAddForm(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddCC} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">رمز مركز التكلفة الجديد</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: CC-YARD-02"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">اسم مركز التكلفة / المشروع</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: مشروع تطوير منشآت سويس كابلز"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">القسم الداخلي</label>
                <select 
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] bg-white"
                >
                  <option value="موقع العمليات الخارجي">موقع العمليات الخارجي</option>
                  <option value="الورشة والصيانة والتشغيل المركزية">الورشة والصيانة والتشغيل المركزية</option>
                  <option value="الإدارة العامة والمبيعات والمالية">الإدارة العامة والمبيعات والمالية</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">الموازنة الكلية المعتمدة (ج.م)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    required
                    placeholder="مثال: 5000000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full pl-12 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold">ج.م</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">المهندس المسؤول / مدير المشروع</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: م. أحمد عبد الهادي"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button 
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#0F4C81] text-white text-sm font-bold rounded-xl hover:bg-[#0c3d67] transition-colors"
                >
                  حفظ مركز التكلفة
                </button>
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
