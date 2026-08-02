import React, { useState } from 'react';
import { Tender } from '../types';
import { initialTenders } from '../mockData';
import { Plus, Search, Award, Calendar, DollarSign, FileSpreadsheet, Percent, Trash2 } from 'lucide-react';

export default function Tenders() {
  const [tenders, setTenders] = useState<Tender[]>(initialTenders);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [code, setCode] = useState(`EC-TND-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`);
  const [title, setTitle] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [bidAmount, setBidAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTender: Tender = {
      id: Math.random().toString(),
      code,
      title,
      closingDate,
      bidAmount: parseFloat(bidAmount) || 0,
      status: 'submitted'
    };
    setTenders([newTender, ...tenders]);
    setShowAddForm(false);
    // Reset Form
    setCode(`EC-TND-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`);
    setTitle('');
    setClosingDate('');
    setBidAmount('');
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المناقصة؟')) {
      setTenders(tenders.filter(t => t.id !== id));
    }
  };

  const handleUpdateStatus = (id: string, status: 'won' | 'lost' | 'pending') => {
    setTenders(tenders.map(t => t.id === id ? { ...t, status } : t));
  };

  const filtered = tenders.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.code.toLowerCase().includes(search.toLowerCase())
  );

  const totalSubmittedValue = tenders.reduce((sum, t) => sum + t.bidAmount, 0);
  const totalWonValue = tenders.filter(t => t.status === 'won').reduce((sum, t) => sum + t.bidAmount, 0);
  const wonCount = tenders.filter(t => t.status === 'won').length;

  return (
    <div className="p-6 space-y-6 dir-rtl text-right font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة ودراسة المناقصات (Tenders Portal)</h1>
          <p className="text-slate-500 mt-1 text-sm">متابعة العطاءات المقدمة لتأجير الأوناش التخصصية للمشروعات القومية والخاصة في مصر</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2.5 bg-[#0F4C81] text-white font-bold text-sm rounded-xl hover:bg-[#0c3d67] transition-colors flex items-center gap-1.5 self-start"
        >
          <Plus className="w-5 h-5" /> تسجيل عطاء مناقصة جديد
        </button>
      </div>

      {/* Tender Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">إجمالي قيمة العطاءات المقدمة</span>
            <p className="text-xl font-black text-[#0F4C81]">{totalSubmittedValue.toLocaleString()} ج.م</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0F4C81] flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">المناقصات التي تم رسوها علينا</span>
            <p className="text-xl font-black text-emerald-600">{totalWonValue.toLocaleString()} ج.م ({wonCount} مناقصة)</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">معدل الفوز بالصفقات</span>
            <p className="text-xl font-black text-[#F7941D]">
              {tenders.length > 0 ? `${Math.round((wonCount / tenders.length) * 100)}%` : '0%'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F7941D] flex items-center justify-center">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative">
          <input 
            type="text" 
            placeholder="البحث باسم الجهة الطارحة للمناقصة، أو كود الملف..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-11 pl-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>
      </div>

      {/* Tenders Grid Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 font-bold text-slate-700">كود المناقصة</th>
                <th className="px-6 py-4 font-bold text-slate-700">موضوع المناقصة والجهة الطارحة</th>
                <th className="px-6 py-4 font-bold text-slate-700">تاريخ الإغلاق المالي</th>
                <th className="px-6 py-4 font-bold text-slate-700">قيمة عرضنا المالي (Bid)</th>
                <th className="px-6 py-4 font-bold text-slate-700">الحالة الحالية</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-center">الإجراءات والقرارات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(tender => (
                <tr key={tender.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-600">{tender.code}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 leading-snug max-w-lg">{tender.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{tender.closingDate}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-extrabold text-[#0F4C81]">{tender.bidAmount.toLocaleString()} ج.م</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      tender.status === 'won' ? 'bg-emerald-50 text-emerald-700' :
                      tender.status === 'lost' ? 'bg-rose-50 text-rose-700' :
                      tender.status === 'submitted' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {tender.status === 'won' ? 'تم الفوز والترسية' :
                       tender.status === 'lost' ? 'لم يرسو (مستبعد)' :
                       tender.status === 'submitted' ? 'تم تقديم العطاء' : 'تحت الدراسة ماليًا'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {tender.status !== 'won' && tender.status !== 'lost' && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(tender.id, 'won')}
                            className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded-lg hover:bg-emerald-100"
                          >
                            إرساء
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(tender.id, 'lost')}
                            className="text-xs bg-rose-50 text-rose-700 font-bold px-2 py-1 rounded-lg hover:bg-rose-100"
                          >
                            استبعاد
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => handleDelete(tender.id)}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
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
      </div>

      {/* Add Tender Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-100 overflow-hidden text-right">
            <div className="bg-[#0F4C81] p-6 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg">دراسة وتسجيل عطاء مناقصة</h3>
              <button onClick={() => setShowAddForm(false)} className="text-white hover:bg-white/10 rounded-lg p-1">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">كود ملف المناقصة</label>
                <input 
                  type="text" 
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">موضوع العطاء ورأس الإعلان</label>
                <textarea 
                  required
                  placeholder="مثال: تقديم أوناش تلسكوبية لمشروع مصنع الأسمدة الفوسفاتية بالعين السخنة"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">تاريخ الإغلاق المالي وتقديم المظاريف</label>
                <input 
                  type="date" 
                  required
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">قيمة العطاء المالي المقترح (ج.م)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    required
                    placeholder="مثال: 3200000"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
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
                  حفظ وتقديم المظروف
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
