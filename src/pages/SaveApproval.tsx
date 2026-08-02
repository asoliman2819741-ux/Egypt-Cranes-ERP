import React, { useState } from 'react';
import { ApprovalRequest } from '../types';
import { 
  Clock, CheckCircle, XCircle, FileText, Search, Eye, History, User, Calendar, MessageSquare, X 
} from 'lucide-react';

export default function SaveApproval({
  requests,
  onUpdateRequests
}: {
  requests: ApprovalRequest[];
  onUpdateRequests: (requests: ApprovalRequest[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'save' | 'edit' | 'delete'>('all');
  const [selectedReq, setSelectedReq] = useState<ApprovalRequest | null>(null);
  const [notes, setNotes] = useState('');

  const filtered = requests.filter(req => {
    const matchesSearch = 
      req.recordSummary.toLowerCase().includes(search.toLowerCase()) || 
      req.requestedByName.toLowerCase().includes(search.toLowerCase()) ||
      req.recordId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesType = typeFilter === 'all' || req.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleApprove = (id: string) => {
    const updated = requests.map(r => r.id === id ? { 
      ...r, 
      status: 'approved' as const, 
      approverName: 'أشرف سليمان (مدير النظام)', 
      actionDate: new Date().toISOString().replace('T', ' ').substr(0, 19), 
      notes 
    } : r);
    onUpdateRequests(updated);
    setSelectedReq(null);
    setNotes('');
  };

  const handleReject = (id: string) => {
    const updated = requests.map(r => r.id === id ? { 
      ...r, 
      status: 'rejected' as const, 
      approverName: 'أشرف سليمان (مدير النظام)', 
      actionDate: new Date().toISOString().replace('T', ' ').substr(0, 19), 
      notes 
    } : r);
    onUpdateRequests(updated);
    setSelectedReq(null);
    setNotes('');
  };

  const typeLabel: Record<string, string> = { save: 'حفظ سجل جديد', edit: 'تعديل سجل قائم', delete: 'حذف نهائي' };
  const typeColor: Record<string, string> = { save: 'bg-blue-50 text-blue-700 border-blue-100', edit: 'bg-amber-50 text-amber-700 border-amber-100', delete: 'bg-rose-50 text-rose-700 border-rose-100' };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800">صندوق اعتمادات وتعميد العمليات</h1>
          <p className="text-xs text-slate-400 mt-1">مراجعة والبت في طلبات الإدخال والتحرير الصادرة من الموظفين التي تتطلب تعميد المشرف</p>
        </div>
      </div>

      {/* Counters row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'طلبات قيد المراجعة والانتظار', value: requests.filter(r => r.status === 'pending').length, color: 'bg-amber-50/50 text-amber-700 border-amber-100/50' },
          { label: 'الطلبات المعتمدة والمرحلة', value: requests.filter(r => r.status === 'approved').length, color: 'bg-emerald-50/50 text-emerald-700 border-emerald-100/50' },
          { label: 'الطلبات المرفوضة والملغاة', value: requests.filter(r => r.status === 'rejected').length, color: 'bg-rose-50/50 text-rose-700 border-rose-100/50' },
          { label: 'إجمالي طلبات السجل التاريخي', value: requests.length, color: 'bg-blue-50/50 text-blue-700 border-blue-100/50' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.color} rounded-2xl p-4 border bg-white shadow-sm flex items-center justify-between`}>
            <div>
              <p className="text-[10px] font-bold uppercase opacity-80">{stat.label}</p>
              <p className="text-2xl font-black mt-1">{stat.value}</p>
            </div>
            <FileText className="w-8 h-8 opacity-20" />
          </div>
        ))}
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="البحث بالوصف أو الرقم المرجعي للسجل أو اسم مقدم الطلب..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full pr-11 pl-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" 
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value as any)} 
              className="px-3 py-2.5 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C81] font-bold text-slate-600"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">انتظار الاعتماد</option>
              <option value="approved">معتمدة</option>
              <option value="rejected">مرفوضة</option>
            </select>
            <select 
              value={typeFilter} 
              onChange={e => setTypeFilter(e.target.value as any)} 
              className="px-3 py-2.5 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C81] font-bold text-slate-600"
            >
              <option value="all">جميع الأنواع</option>
              <option value="save">حفظ جديد</option>
              <option value="edit">تعديل سجل</option>
              <option value="delete">حذف سجل</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500">تفاصيل السجل والحدث</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-slate-500">نوع الإجراء</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-slate-500">الشاشة الفرعية</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-slate-500">مقدم الطلب</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-slate-500">تاريخ الطلب</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-slate-500">حالة الاعتماد</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-slate-500">عرض</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(req => (
                <tr key={req.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-extrabold text-slate-800 text-xs leading-relaxed max-w-md truncate" title={req.recordSummary}>
                        {req.recordSummary}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">الرقم المرجعي: {req.recordId}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black border ${typeColor[req.type]}`}>
                      {typeLabel[req.type]}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-xs font-extrabold text-slate-600">{req.screenName}</td>
                  <td className="px-4 py-4 text-center text-xs font-bold text-slate-500">{req.requestedByName}</td>
                  <td className="px-4 py-4 text-center text-xs font-bold text-slate-400 font-mono">
                    {req.requestDate.replace('T', ' ')}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                      req.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : req.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {req.status === 'pending' ? <Clock className="w-3.5 h-3.5" /> : req.status === 'approved' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>
                        {req.status === 'pending' ? 'بانتظار المراجعة' : req.status === 'approved' ? 'موافق معمد' : 'مرفوض'}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button 
                      onClick={() => setSelectedReq(req)} 
                      className={`p-1.5 rounded-lg border transition-colors ${
                        req.status === 'pending'
                          ? 'bg-blue-50 border-blue-100 text-[#0F4C81] hover:bg-blue-100'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {req.status === 'pending' ? <Eye className="w-4 h-4" /> : <History className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-xs font-bold">لا يوجد طلبات اعتماد ومطابقة مطابقة للبحث</p>
          </div>
        )}
      </div>

      {/* Selected Request Drawer/Modal */}
      {selectedReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100 animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                  selectedReq.type === 'save' 
                    ? 'bg-blue-50 text-blue-700 border-blue-100' 
                    : selectedReq.type === 'edit' 
                      ? 'bg-amber-50 text-amber-700 border-amber-100' 
                      : 'bg-rose-50 text-rose-700 border-rose-100'
                }`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800">
                    طلب اعتماد وتعميد إجراء: {typeLabel[selectedReq.type]}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">معرف السجل: {selectedReq.recordId}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedReq(null); setNotes(''); }} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              {/* Core Information Panel */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                  <span className="block text-[10px] text-slate-400 font-bold mb-1">الموديول / شاشة العمليات</span>
                  <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {selectedReq.screenName}
                  </span>
                </div>
                <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                  <span className="block text-[10px] text-slate-400 font-bold mb-1">تاريخ ووقت تقديم الطلب</span>
                  <span className="text-xs font-bold text-slate-500 font-mono">{selectedReq.requestDate.replace('T', ' ')}</span>
                </div>
                <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                  <span className="block text-[10px] text-slate-400 font-bold mb-1">الموظف مقدم الطلب</span>
                  <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {selectedReq.requestedByName}
                  </span>
                </div>
                <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                  <span className="block text-[10px] text-slate-400 font-bold mb-1">حالة السند الحالية</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                    selectedReq.status === 'pending' ? 'bg-amber-50 text-amber-700' : selectedReq.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {selectedReq.status === 'pending' ? 'انتظار الموافقة' : selectedReq.status === 'approved' ? 'تمت الموافقة والاعتماد' : 'مرفوض'}
                  </span>
                </div>
              </div>

              {/* Summary Description Box */}
              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/20">
                <h4 className="text-[11px] font-black text-[#0F4C81] mb-2">خلاصة ووصف السجل المطلوب تعميده:</h4>
                <p className="text-xs font-semibold text-slate-700 leading-relaxed bg-white p-3 border border-slate-100 rounded-lg">
                  {selectedReq.recordSummary}
                </p>
              </div>

              {/* Historic Action details if already processed */}
              {selectedReq.status !== 'pending' && (
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30 space-y-3">
                  <h4 className="text-[11px] font-black text-slate-600">تفاصيل وسجل اتخاذ القرار:</h4>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#0F4C81]/5 text-[#0F4C81] flex items-center justify-center font-bold text-xs">
                      {selectedReq.approverName?.charAt(0)}
                    </div>
                    <div className="flex-1 space-y-1.5 text-right">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-800">{selectedReq.approverName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{selectedReq.actionDate}</span>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                        selectedReq.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {selectedReq.status === 'approved' ? 'موافقة وتعميد السجل' : 'رفض نهائي'}
                      </span>
                      {selectedReq.notes && (
                        <div className="p-3 bg-white border border-slate-100 rounded-lg text-xs font-bold text-slate-600 flex gap-2">
                          <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5" />
                          <p>{selectedReq.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action input for processing */}
              {selectedReq.status === 'pending' && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      ملاحظات الاعتماد والتعميد أو أسباب الرفض (اختياري)
                    </label>
                    <textarea 
                      value={notes} 
                      onChange={e => setNotes(e.target.value)} 
                      placeholder="أضف مبررات الاعتماد أو أسباب الرفض لتوثيقها بالسجل..." 
                      rows={3} 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C81] resize-none" 
                    />
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleApprove(selectedReq.id)} 
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-black text-xs transition-colors shadow-md shadow-emerald-900/10"
                    >
                      <CheckCircle className="w-4 h-4" /> اعتماد وتعميد السجل
                    </button>
                    <button 
                      onClick={() => handleReject(selectedReq.id)} 
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-black text-xs transition-colors shadow-md shadow-rose-900/10"
                    >
                      <XCircle className="w-4 h-4" /> رفض الإجراء وإعادته للمراجعة
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
