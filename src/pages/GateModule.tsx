import React, { useState } from 'react';
import { GatePass, Crane, Driver } from '../types';
import { 
  Truck, ShieldCheck, QrCode, FileText, Printer, AlertTriangle, 
  Search, ClipboardCheck, ArrowUpRight, ArrowDownRight, RefreshCw, CheckCircle, XCircle, Sparkles
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import QRCodeGenerator from '../components/QRCodeGenerator';

interface GateModuleProps {
  cranes: Crane[];
  drivers: Driver[];
  gatePasses: GatePass[];
  onAddGatePass: (pass: GatePass) => void;
}

export default function GateModule({ cranes, drivers, gatePasses, onAddGatePass }: GateModuleProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'out' | 'in' | 'missing' | 'qr-generator'>('dashboard');
  const [search, setSearch] = useState('');
  const [selectedPass, setSelectedPass] = useState<GatePass | null>(null);

  // QR Scanning Simulation state
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  // Exit/Entry checklist form state
  const [selectedCraneId, setSelectedCraneId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [gateType, setGateType] = useState<'out' | 'in'>('out');
  const [hasScanFail, setHasScanFail] = useState(false);
  const [missingItemsInput, setMissingItemsInput] = useState('');
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({
    'مطابقة رقم اللوحة ورخصة الونش والمقطورة': true,
    'سلامة جسم الونش الخارجي وعدم وجود أضرار': true,
    'شهادة فحص وايرات وسلاسل معتمدة وسارية': true,
    'وجود طفاية حريق صالحة ومطابقة للوائح الأمن': true,
    'ارتداء السائق والمشغل لمهمات الوقاية الشخصية PPE': true,
  });

  const toggleChecklist = (key: string) => {
    setChecklist({ ...checklist, [key]: !checklist[key] });
  };

  const handleCreatePass = (e: React.FormEvent) => {
    e.preventDefault();
    const crane = cranes.find(c => c.id === selectedCraneId);
    const driver = drivers.find(d => d.id === selectedDriverId);

    if (!crane || !driver) {
      alert('يرجى تحديد الونش والسائق لإصدار تصريح البوابة');
      return;
    }

    if (driver.status === 'vacation') {
      alert(`🚨 منع أمني! السائق [${driver.name}] مسجل في إجازة رسمية حالياً، يرجى التنسيق مع إدارة الموارد البشرية.`);
      return;
    }

    const missingList = missingItemsInput
      ? missingItemsInput.split(',').map(i => i.trim()).filter(Boolean)
      : [];

    const isFailed = hasScanFail || missingList.length > 0;

    const newPass: GatePass = {
      id: Math.random().toString(),
      passNo: `GP-${gateType.toUpperCase()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      type: gateType,
      craneId: crane.id,
      craneName: crane.nameAr,
      driverName: driver.name,
      timestamp: new Date().toLocaleString('ar-EG'),
      hasScanFail: isFailed,
      missingItems: missingList,
      checklist: checklist
    };

    onAddGatePass(newPass);
    setActiveTab('dashboard');
    alert(`تم إصدار تصريح البوابة بنجاح! رقم: ${newPass.passNo}`);
    
    // Reset
    setSelectedCraneId('');
    setSelectedDriverId('');
    setMissingItemsInput('');
    setHasScanFail(false);
  };

  const startQRScan = (crane: Crane) => {
    setScanning(true);
    setScanResult(null);
    setTimeout(() => {
      // Simulate auto scanning check in 1.5 seconds
      setScanning(false);
      const isMissing = crane.id === 'c4'; // Liebherr LR 1600 has mock missing components
      setScanResult({
        craneCode: crane.code,
        craneName: crane.nameAr,
        status: isMissing ? 'fail' : 'pass',
        missing: isMissing 
          ? ['حلقة رفع شحم رئيسية ٣ بوصة', 'قفل أمان واير فولاذي مضاد للالتواء'] 
          : []
      });
      if (isMissing) {
        setHasScanFail(true);
        setMissingItemsInput('حلقة رفع شحم رئيسية ٣ بوصة، قفل أمان واير فولاذي مضاد للالتواء');
      } else {
        setHasScanFail(false);
        setMissingItemsInput('');
      }
    }, 1500);
  };

  const filtered = gatePasses.filter(pass => 
    pass.craneName.toLowerCase().includes(search.toLowerCase()) ||
    pass.driverName.toLowerCase().includes(search.toLowerCase()) ||
    pass.passNo.toLowerCase().includes(search.toLowerCase())
  );

  // Compute stats for missing components report
  const allMissingItems = gatePasses
    .filter(p => p.hasScanFail && p.missingItems && p.missingItems.length > 0)
    .flatMap(p => p.missingItems.map(item => ({ item, pass: p })));

  return (
    <div className="p-6 space-y-6 dir-rtl text-right font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">لوحة البوابة الذكية (Security Gate Portal)</h1>
          <p className="text-slate-500 mt-1 text-sm">مراقبة خروج ودخول الأوناش، فحص مكونات الرافعات بـ QR، وتسجيل العُدد المفقودة</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { setGateType('out'); setActiveTab('out'); }}
            className="px-4 py-2 bg-[#0F4C81] text-white font-bold text-xs rounded-xl hover:bg-[#0c3d67] transition-colors flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4" /> تسجيل خروج ونش (Gate Out)
          </button>
          <button 
            onClick={() => { setGateType('in'); setActiveTab('out'); }}
            className="px-4 py-2 bg-[#F7941D] text-slate-950 font-bold text-xs rounded-xl hover:bg-[#e08315] transition-colors flex items-center gap-1.5"
          >
            <ArrowDownRight className="w-4 h-4" /> تسجيل دخول ونش (Gate In)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`px-5 py-2 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'dashboard' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          أرشيف تصاريح الدخول والخروج
        </button>
        <button 
          onClick={() => setActiveTab('out')}
          className={`px-5 py-2 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'out' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          إصدار تصريح بوابة جديد
        </button>
        <button 
          onClick={() => setActiveTab('qr-generator')}
          className={`px-5 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'qr-generator' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>توليد وملصقات الـ QR المعتمدة</span>
        </button>
        <button 
          onClick={() => setActiveTab('missing')}
          className={`px-5 py-2 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'missing' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          تقرير النقص والمكونات المفقودة
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">إجمالي تصاريح البوابة</span>
                <p className="text-xl font-black text-[#0F4C81]">{gatePasses.length} تصريح</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0F4C81] flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">تصاريح خروج الأوناش</span>
                <p className="text-xl font-black text-emerald-600">
                  {gatePasses.filter(p => p.type === 'out').length} حركة خروج
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">تصاريح مع عيوب أو نقص</span>
                <p className="text-xl font-black text-rose-600">
                  {gatePasses.filter(p => p.hasScanFail).length} عيب مسجل
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="relative">
              <input 
                type="text" 
                placeholder="البحث برقم السند، كود الونش، أو السائق..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-11 pl-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
          </div>

          {/* Permit Archive */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 font-bold text-slate-700">رقم التصريح</th>
                    <th className="px-6 py-4 font-bold text-slate-700">نوع الحركة</th>
                    <th className="px-6 py-4 font-bold text-slate-700">الونش والسائق المعني</th>
                    <th className="px-6 py-4 font-bold text-slate-700">توقيت البوابة</th>
                    <th className="px-6 py-4 font-bold text-slate-700">الفحص الأمني</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-center">التصريح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(pass => (
                    <tr key={pass.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-[#0F4C81]">{pass.passNo}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          pass.type === 'out' ? 'bg-[#0F4C81]/10 text-[#0F4C81]' : 'bg-[#F7941D]/10 text-[#F7941D]'
                        }`}>
                          {pass.type === 'out' ? 'خروج' : 'دخول'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 leading-snug">
                          {pass.type === 'out' ? 'تصريح خروج' : 'تصريح دخول'} للرافعة {pass.craneName} بقيادة السائق {pass.driverName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono font-bold text-slate-500">{pass.timestamp}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                          pass.hasScanFail ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {pass.hasScanFail ? 'نقص / عطل' : 'سليم'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => setSelectedPass(pass)}
                          className="p-1.5 bg-blue-50 text-[#0F4C81] hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'out' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Checklist and general form */}
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="border-b pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">بيانات حركة وتصريح الونش</h3>
                <p className="text-xs text-slate-400">تعبئة نموذج الأمن ومطابقة البيانات الفنية قبل تشغيل البوابات</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded-full text-slate-600">
                الحركة: {gateType === 'out' ? 'خروج من ساحة الشركة' : 'دخول لساحة الشركة'}
              </span>
            </div>

            <form onSubmit={handleCreatePass} className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">اختر الونش / الرافعة</label>
                  <select 
                    required
                    value={selectedCraneId}
                    onChange={(e) => setSelectedCraneId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-xs"
                  >
                    <option value="">-- اختر ونش --</option>
                    {cranes.map(c => (
                      <option key={c.id} value={c.id}>{c.nameAr} ({c.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">اختر السائق المصاحب</label>
                  <select 
                    required
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-xs"
                  >
                    <option value="">-- اختر سائق --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Security Checklist */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-800 text-xs">قائمة الفحص الأمني السريع (Security Checklist)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.keys(checklist).map(key => (
                    <label key={key} className="flex items-center gap-2 p-2 border rounded-lg bg-slate-50/50 hover:bg-slate-50 cursor-pointer text-[11px] font-medium text-slate-600">
                      <input 
                        type="checkbox" 
                        checked={checklist[key]} 
                        onChange={() => toggleChecklist(key)}
                        className="w-4 h-4 text-[#0F4C81]" 
                      />
                      <span>{key}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Missing Components Box */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">المكونات والعُدد الناقصة أو الأعطال التالفة (إن وجد)</label>
                <input 
                  type="text"
                  placeholder="مثال: طفاية حريق بودرة مفقودة، غطاء زيت المحرك تالف (افصلها بفاصلة)"
                  value={missingItemsInput}
                  onChange={(e) => setMissingItemsInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0F4C81] text-white font-bold text-xs rounded-xl hover:bg-[#0c3d67] transition-colors"
                >
                  إصدار تصريح البوابة واعتماد الحركة
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 text-xs font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>

          {/* QR Scan Simulator */}
          <div className="lg:col-span-4 bg-[#101524] p-6 rounded-2xl border border-slate-900 shadow-sm flex flex-col justify-between text-white text-xs h-full min-h-[400px]">
            <div className="space-y-1">
              <h3 className="font-extrabold text-[#F7941D]">جهاز فحص البوابة بـ QR (E-Scanner)</h3>
              <p className="text-slate-400 text-[10px]">فحص آلي لمطابقة وتكامل مكونات الأوناش ومعدات السائق</p>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-6">
              {scanning ? (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-20 h-20 border-4 border-[#F7941D] border-t-transparent rounded-full animate-spin flex items-center justify-center">
                    <QrCode className="w-10 h-10 text-white" />
                  </div>
                  <span className="text-[#F7941D] font-bold animate-pulse">جاري الاتصال بالونش والتحقق عبر RFID...</span>
                </div>
              ) : scanResult ? (
                <div className="w-full bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    {scanResult.status === 'pass' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    )}
                    <div>
                      <span className="font-bold block text-slate-100">{scanResult.craneName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">كود فني: {scanResult.craneCode}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold block text-[10px]">حالة فحص المكونات الرقمية:</span>
                    <span className={`font-bold block ${
                      scanResult.status === 'pass' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {scanResult.status === 'pass' ? 'مطابق بنسبة ١٠٠٪ - لا توجد نواقص' : 'تم اكتشاف نقص بالمكونات المرفقة!'}
                    </span>
                  </div>

                  {scanResult.missing.length > 0 && (
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 space-y-1">
                      <span className="font-bold text-[10px] block">العناصر المفقودة المسجلة:</span>
                      <ul className="list-disc mr-4 text-[10px] font-medium space-y-0.5">
                        {scanResult.missing.map((mi: string, i: number) => (
                          <li key={i}>{mi}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-3 p-6 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                  <QrCode className="w-16 h-16 mx-auto text-slate-600 animate-pulse" />
                  <p className="text-slate-400">انقر أدناه لبدء فحص مكونات ونش عبر البوابة آليًا</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 block font-bold mb-1">حدد ونش للاختبار:</span>
              <div className="grid grid-cols-2 gap-2">
                {cranes.slice(0, 4).map(c => (
                  <button 
                    key={c.id} 
                    type="button" 
                    onClick={() => startQRScan(c)}
                    className="p-2 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 hover:border-[#F7941D] transition-colors bg-slate-950/40"
                  >
                    فحص: {c.code}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'missing' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <h3 className="font-extrabold text-slate-800">تقرير النقص والملحقات المفقودة (Missing Equipment Report)</h3>
            <p className="text-xs text-slate-400">حصر فوري لقطع الغيار المفقودة أو عُدد الصيانة التي لم تُسلم للبوابة الأمنية عند العودة من المواقع الخارجية</p>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            {allMissingItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-100">
                      <th className="px-6 py-4 font-bold text-slate-700">البند المفقود</th>
                      <th className="px-6 py-4 font-bold text-slate-700">المعدة / الونش المعني</th>
                      <th className="px-6 py-4 font-bold text-slate-700">رقم الحركة وتاريخ التثبيت</th>
                      <th className="px-6 py-4 font-bold text-slate-700">السائق / المستلم المعني</th>
                      <th className="px-6 py-4 font-bold text-slate-700">حالة الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allMissingItems.map((mi, idx) => (
                      <tr key={idx} className="hover:bg-rose-50/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-rose-700">{mi.item}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800">{mi.pass.craneName}</td>
                        <td className="px-6 py-4 font-mono text-slate-500 text-xs">
                          {mi.pass.passNo} ({mi.pass.timestamp})
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{mi.pass.driverName}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
                            قيد المراجعة والشراء
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <ShieldCheck className="w-16 h-16 mx-auto mb-3 text-emerald-500" />
                <p className="font-bold text-sm">ممتاز! لا توجد حالياً أي ملحقات أو عُدد مفقودة مسجلة بالبوابات.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'qr-generator' && (
        <QRCodeGenerator cranes={cranes} gatePasses={gatePasses} />
      )}

      {/* Printable Gate Permit Modal */}
      {selectedPass && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-100 overflow-hidden text-right flex flex-col max-h-[90vh]">
            <div className="bg-[#0F4C81] p-6 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <h3 className="font-bold text-lg">تصريح بوابة معتمد رسمي</h3>
              </div>
              <button onClick={() => setSelectedPass(null)} className="text-white hover:bg-white/10 rounded-lg p-1 font-bold">×</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {/* BRAND HEADER FOR PRINT */}
              <div className="flex items-start justify-between border-b pb-4">
                <div className="space-y-1">
                  <h4 className="font-black text-slate-800 text-sm">شركة إيجيبت كرينز لخدمات الرفع الثقيل</h4>
                  <p className="text-[10px] text-slate-400">تصريح دخول وخروج أوناش بمواقع العمليات</p>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2 border rounded-xl bg-white shadow-3xs">
                  <QRCodeSVG 
                    value={JSON.stringify({
                      app: "EgyptCranes-ERP",
                      type: "gate_trip_pass",
                      passNo: selectedPass.passNo,
                      tripType: selectedPass.type === 'out' ? "GATE_OUT_EXIT" : "GATE_IN_ENTRY",
                      crane: selectedPass.craneName,
                      driver: selectedPass.driverName,
                      timestamp: selectedPass.timestamp,
                      checklist_status: selectedPass.hasScanFail ? "WARNING_DEFECTS" : "PASSED_OK"
                    })}
                    size={64}
                    level="M"
                  />
                  <span className="text-[8px] text-slate-500 font-bold font-mono">{selectedPass.passNo}</span>
                </div>
              </div>

              {/* Pass details */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="bg-slate-50 p-3 rounded-lg space-y-1">
                  <span className="text-slate-400 block mb-1">المعدة / الونش:</span>
                  <span className="text-slate-800 font-bold">{selectedPass.craneName}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg space-y-1 text-left">
                  <span className="text-slate-400 block mb-1">الحركة والتاريخ:</span>
                  <span className="text-slate-800 block font-bold">{selectedPass.type === 'out' ? 'خــروج ونـش' : 'دخــول ونـش'}</span>
                  <span className="text-slate-500 font-mono text-[10px] block mt-1">{selectedPass.timestamp}</span>
                </div>
              </div>

              {/* Security approvals */}
              <div className="border rounded-xl p-4 space-y-3 bg-slate-50 text-xs">
                <h4 className="font-bold text-slate-800 border-b pb-1.5">مراجعة أمن البوابة الخارجية</h4>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">مسؤول البوابة المعتمد:</span>
                  <span className="font-bold text-slate-800">الأمن المركزي بالبوابة</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">البيان والملاحظات:</span>
                  <span className="font-bold text-slate-800">
                    {selectedPass.hasScanFail 
                      ? `مكونات ناقصة: ${selectedPass.missingItems.join(', ')}` 
                      : 'تم فحص السلامة والمطابقة كاملة'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">الفحص والتدقيق الفني:</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    selectedPass.hasScanFail ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {selectedPass.hasScanFail ? 'مرفوض - نواقص لم تحل' : 'مطابق وآمن'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 flex-shrink-0">
              <button 
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-[#0F4C81] text-white rounded-xl hover:bg-[#0c3d67] font-bold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> طباعة التصريح المعتمد (Gate Permit)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
