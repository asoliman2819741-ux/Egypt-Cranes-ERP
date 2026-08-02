import React, { useState } from 'react';
import { Contract, Crane } from '../types';
import { initialContracts } from '../mockData';
import { Plus, Search, FileSignature, Calendar, DollarSign, Briefcase, Trash2 } from 'lucide-react';
import ContractTimeline from '../components/ContractTimeline';

interface ContractsProps {
  cranes: Crane[];
  contracts: Contract[];
  onAddContract: (newContract: Contract) => void;
  onDeleteContract: (id: string) => void;
}

export default function Contracts({ cranes, contracts, onAddContract, onDeleteContract }: ContractsProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'timeline'>('timeline');
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [contractNo, setContractNo] = useState(`EC-CNT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`);
  const [customerName, setCustomerName] = useState('');
  const [craneId, setCraneId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedCrane = cranes.find(c => c.id === craneId);
    if (!assignedCrane) {
      alert('يرجى اختيار الونش المخصص للتعاقد');
      return;
    }

    const newContract: Contract = {
      id: Math.random().toString(),
      contractNo,
      customerName,
      craneId,
      craneName: assignedCrane.nameAr,
      startDate,
      endDate,
      value: parseFloat(value) || 0,
      status: 'active'
    };

    onAddContract(newContract);
    setShowAddForm(false);
    // Reset
    setContractNo(`EC-CNT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`);
    setCustomerName('');
    setCraneId('');
    setStartDate('');
    setEndDate('');
    setValue('');
  };

  const filtered = contracts.filter(c => 
    c.customerName.toLowerCase().includes(search.toLowerCase()) ||
    c.contractNo.toLowerCase().includes(search.toLowerCase()) ||
    c.craneName.toLowerCase().includes(search.toLowerCase())
  );

  const totalVal = contracts.reduce((sum, c) => sum + c.value, 0);
  const activeCount = contracts.filter(c => c.status === 'active').length;

  return (
    <div className="p-6 space-y-6 dir-rtl text-right font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">سجل عقود تأجير الأوناش والمشاريع</h1>
          <p className="text-slate-500 mt-1 text-sm">متابعة شروط التعاقد وتأجير الرافعات لشركات المقاولات الكبرى في مصر</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2.5 bg-[#0F4C81] text-white font-bold text-sm rounded-xl hover:bg-[#0c3d67] transition-colors flex items-center gap-1.5 self-start"
        >
          <Plus className="w-5 h-5" /> توقيع عقد تأجير جديد
        </button>
      </div>

      {/* Top metrics summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">إجمالي القيمة التعاقدية</span>
            <p className="text-xl font-black text-[#0F4C81]">{totalVal.toLocaleString()} ج.م</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0F4C81] flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">العقود سارية المفعول</span>
            <p className="text-xl font-black text-emerald-600">{activeCount} عقد نشط</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">معدل الإنجاز السنوي</span>
            <p className="text-xl font-black text-[#F7941D]">٩٢.٤٪</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F7941D] flex items-center justify-center">
            <FileSignature className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tab Navigation for Contracts & Timeline */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'timeline'
              ? 'border-[#0F4C81] text-[#0F4C81] font-black'
              : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
          }`}
        >
          <Calendar className="w-4 h-4 text-orange-500 animate-pulse" />
          <span>المخطط الزمني ومتابعة المشروعات (Gantt Chart)</span>
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'list'
              ? 'border-[#0F4C81] text-[#0F4C81] font-black'
              : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>عقود تأجير الأسطول والعملاء</span>
        </button>
      </div>

      {activeTab === 'timeline' ? (
        <ContractTimeline contracts={contracts} cranes={cranes} />
      ) : (
        <>
          {/* Filter Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/50 shadow-sm">
            <div className="relative">
              <input 
                type="text" 
                placeholder="البحث باسم العميل، رقم العقد، أو الونش المخصص..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-11 pl-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
          </div>

          {/* Contracts table/list */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 font-bold text-slate-700">رقم العقد</th>
                    <th className="px-6 py-4 font-bold text-slate-700">العميل والمشروع</th>
                    <th className="px-6 py-4 font-bold text-slate-700">الونش المستأجر</th>
                    <th className="px-6 py-4 font-bold text-slate-700">الفترة الزمنية</th>
                    <th className="px-6 py-4 font-bold text-slate-700">قيمة العقد</th>
                    <th className="px-6 py-4 font-bold text-slate-700">الحالة</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(contract => (
                    <tr key={contract.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-[#0F4C81]">{contract.contractNo}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{contract.customerName}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600">{contract.craneName}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>من: {contract.startDate}</span>
                          <span>إلى: {contract.endDate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-slate-800">{contract.value.toLocaleString()} ج.م</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          contract.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                          contract.status === 'completed' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {contract.status === 'active' ? 'ساري' :
                           contract.status === 'completed' ? 'مكتمل' : 'موقوف مؤقتاً'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => onDeleteContract(contract.id)}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                          title="فسخ/حذف العقد"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add Contract Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-100 overflow-hidden text-right">
            <div className="bg-[#0F4C81] p-6 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg">تحرير عقد تأجير رافعة ثقيلة</h3>
              <button 
                onClick={() => setShowAddForm(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">رقم العقد التعاقدي</label>
                <input 
                  type="text" 
                  required
                  value={contractNo}
                  onChange={(e) => setContractNo(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">اسم العميل والجهة المستأجرة</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: شركة بتروجيت للمشروعات البترولية"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">الونش / الرافعة المطلوبة</label>
                <select 
                  required
                  value={craneId}
                  onChange={(e) => setCraneId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] bg-white"
                >
                  <option value="">اختر من الأسطول الحالي...</option>
                  {cranes.map(crane => (
                    <option key={crane.id} value={crane.id}>
                      {crane.nameAr} - (حمولة {crane.capacity} طن)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">تاريخ البدء</label>
                  <input 
                    type="date" 
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">تاريخ الانتهاء</label>
                  <input 
                    type="date" 
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">قيمة العقد الإجمالية (ج.م)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    required
                    placeholder="مثال: 450000"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full pl-12 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold">ج.م</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button 
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#0F4C81] text-white text-sm font-bold rounded-xl hover:bg-[#0c3d67] transition-colors"
                >
                  حفظ وتوقيع العقد
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
