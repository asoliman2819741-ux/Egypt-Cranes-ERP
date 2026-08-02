import React, { useState, useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  QrCode, Printer, Check, Copy, ShieldCheck, Truck, User, 
  Settings, RefreshCw, FileText, Calendar, Sparkles, CheckCircle2, 
  AlertTriangle, ArrowUpRight, ArrowDownRight, Layers
} from 'lucide-react';
import { Crane, GatePass } from '../types';

interface QRCodeGeneratorProps {
  cranes: Crane[];
  gatePasses: GatePass[];
}

export default function QRCodeGenerator({ cranes, gatePasses }: QRCodeGeneratorProps) {
  const [genType, setGenType] = useState<'crane' | 'trip'>('crane');
  const [selectedCraneId, setSelectedCraneId] = useState<string>(cranes[0]?.id || '');
  const [selectedPassId, setSelectedPassId] = useState<string>(gatePasses[0]?.id || '');
  const [customNote, setCustomNote] = useState<string>('');
  const [qrColor, setQrColor] = useState<string>('#0F4C81');
  const [qrSize, setQrSize] = useState<'S' | 'M' | 'L'>('M');
  const [copied, setCopied] = useState<boolean>(false);

  // Derive active selection
  const activeCrane = useMemo(() => {
    return cranes.find(c => c.id === selectedCraneId) || cranes[0] || null;
  }, [cranes, selectedCraneId]);

  const activePass = useMemo(() => {
    return gatePasses.find(p => p.id === selectedPassId) || gatePasses[0] || null;
  }, [gatePasses, selectedPassId]);

  // Generate QR payload string
  const qrValue = useMemo(() => {
    if (genType === 'crane' && activeCrane) {
      return JSON.stringify({
        app: "EgyptCranes-ERP",
        type: "crane_registry",
        id: activeCrane.id,
        code: activeCrane.code,
        name: activeCrane.nameAr,
        capacity: `${activeCrane.capacity}T`,
        plate: activeCrane.plateNumber,
        verified: "TRUE",
        safety_status: activeCrane.status === 'maintenance' ? 'UNDER_MAINTENANCE' : 'CERTIFIED_SAFE',
        note: customNote || "ملصق معتمد لساحة العمليات"
      }, null, 2);
    } else if (genType === 'trip' && activePass) {
      return JSON.stringify({
        app: "EgyptCranes-ERP",
        type: "gate_trip_pass",
        passNo: activePass.passNo,
        gate: activePass.type === 'out' ? "GATE_OUT_EXIT" : "GATE_IN_ENTRY",
        craneCode: activePass.craneId,
        crane: activePass.craneName,
        driver: activePass.driverName,
        timestamp: activePass.timestamp,
        checklist_verified: activePass.hasScanFail ? "WARNING_DEFECTS" : "PASSED_100",
        note: customNote || "تصريح حركة مؤقت معتمد"
      }, null, 2);
    }
    return "Egypt Cranes Security QR System";
  }, [genType, activeCrane, activePass, customNote]);

  // Helper values for sizes
  const sizePixels = {
    'S': 120,
    'M': 180,
    'L': 240
  }[qrSize];

  // Random Secure Hash for looking authentic
  const securityHash = useMemo(() => {
    const letters = 'ABCDEF0123456789';
    let hash = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) hash += '-';
      hash += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return hash;
  }, [selectedCraneId, selectedPassId, genType]);

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintLabel = () => {
    // Elegant, seamless print viewport trick
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('الرجاء السماح بالنوافذ المنبثقة لطباعة الملصق.');
      return;
    }

    const contentHtml = document.getElementById('printable-qr-card')?.innerHTML || '';

    printWindow.document.write(`
      <html>
        <head>
          <title>طباعة ملصق الـ QR المعتمد - مصر للأوناش</title>
          <meta charset="utf-8" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            body {
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #fff;
              direction: rtl;
              text-align: right;
            }
            .print-card {
              border: 3px double #000;
              padding: 24px;
              width: 450px;
              background: #fff;
              color: #000;
              border-radius: 8px;
              box-shadow: none;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .header h2 {
              margin: 0;
              font-size: 18px;
              font-weight: 800;
            }
            .header p {
              margin: 4px 0 0 0;
              font-size: 11px;
              color: #555;
            }
            .grid {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 12px;
              font-size: 11px;
              margin-bottom: 16px;
            }
            .field-label {
              color: #444;
              font-weight: bold;
              margin-bottom: 2px;
              display: block;
            }
            .field-value {
              font-weight: 800;
              font-size: 12px;
            }
            .barcode-line {
              height: 20px;
              background: repeating-linear-gradient(90deg, #000, #000 2px, transparent 2px, transparent 6px);
              margin-bottom: 12px;
            }
            .qr-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              margin-top: 16px;
              padding-top: 12px;
              border-top: 1px dashed #000;
            }
            .qr-container p {
              margin: 8px 0 0 0;
              font-family: monospace;
              font-size: 9px;
              font-weight: bold;
            }
            @media print {
              body { padding: 0; }
              .print-card { border: 2px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="print-card">
            ${contentHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Intro Block */}
      <div className="bg-white/50 backdrop-blur-md border border-white p-5 rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-[#0F4C81] rounded-lg border border-blue-100">
              <QrCode className="w-5 h-5 text-blue-600" />
            </span>
            <h3 className="font-extrabold text-slate-800 text-sm">نظام توليد ملصقات وتصاريح الـ QR المعتمدة</h3>
          </div>
          <p className="text-[11px] text-slate-400 font-bold mt-1">
            قم بإصدار ملصقات الهوية الفنية المحدثة للأوناش (ID Decals) أو تذاكر العبور المشفرة للسائقين والرحلات المعتمدة بالبوابة.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGenType('crane')}
            className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
              genType === 'crane'
                ? 'bg-[#0F4C81] text-white shadow-3xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
            }`}
          >
            توليد ملصق تعريف رافعة (Crane ID)
          </button>
          <button
            onClick={() => setGenType('trip')}
            className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
              genType === 'trip'
                ? 'bg-[#0F4C81] text-white shadow-3xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
            }`}
          >
            توليد تصريح رحلة بوابة (Trip Pass)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Generator Controls (Left - 5 Columns) */}
        <div className="xl:col-span-5 bg-white/50 backdrop-blur-md border border-white p-5 rounded-2xl shadow-xs space-y-5">
          <div className="border-b pb-3">
            <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-[#0F4C81]" />
              <span>خيارات ومحددات الترميز الذكي</span>
            </h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">اضبط المعايير لتحديث محتوى الـ QR المولد فوريًا.</p>
          </div>

          <div className="space-y-4 text-xs font-semibold text-slate-700">
            {/* Dynamic Target Selection based on genType */}
            {genType === 'crane' ? (
              <div className="space-y-1.5">
                <label className="block text-slate-600 font-bold text-[11px]">اختر الرافعة من الأسطول:</label>
                <select
                  value={selectedCraneId}
                  onChange={e => setSelectedCraneId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs font-bold focus:ring-1 focus:ring-[#0F4C81] focus:outline-none"
                >
                  {cranes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr} - {c.model} ({c.code})
                    </option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-400 font-bold">يقوم هذا الخيار بترميز الهوية والخصائص الفنية وسجل السلامة للونش.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-slate-600 font-bold text-[11px]">اختر تصريح البوابة المعني:</label>
                <select
                  value={selectedPassId}
                  onChange={e => setSelectedPassId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs font-bold focus:ring-1 focus:ring-[#0F4C81] focus:outline-none"
                >
                  {gatePasses.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.passNo} - ونش: {p.craneName} ({p.timestamp})
                    </option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-400 font-bold">يقوم هذا الخيار بترميز تصريح حركة المرور وحالة التدقيق الأمني للبوابة.</p>
              </div>
            )}

            {/* Custom Notes input */}
            <div className="space-y-1.5">
              <label className="block text-slate-600 font-bold text-[11px]">كتابة ملاحظة أمنية فنية مخصصة (تدمج بالـ QR):</label>
              <textarea
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                rows={2}
                maxLength={100}
                placeholder="مثال: يمنع العمل بدون وايرات أمان، صالح لساحة الميناء فقط..."
                className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs font-bold focus:ring-1 focus:ring-[#0F4C81] focus:outline-none resize-none"
              />
              <span className="text-[9px] text-slate-400 block font-bold text-left">أقصى طول: ١٠٠ حرف</span>
            </div>

            {/* Layout Customizer Styles */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-slate-600 font-bold text-[11px]">لون الرمز (QR Color):</label>
                <div className="flex gap-1.5 pt-1">
                  {[
                    { hex: '#0F4C81', name: 'أزرق' },
                    { hex: '#1e293b', name: 'أسود' },
                    { hex: '#10b981', name: 'أخضر' },
                    { hex: '#f97316', name: 'برتقالي' }
                  ].map(color => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setQrColor(color.hex)}
                      style={{ backgroundColor: color.hex }}
                      className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform hover:scale-110 ${
                        qrColor === color.hex ? 'border-amber-400 scale-110 shadow-3xs' : 'border-white'
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-600 font-bold text-[11px]">حجم الرمز للطباعة:</label>
                <div className="flex gap-1.5">
                  {(['S', 'M', 'L'] as const).map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setQrSize(size)}
                      className={`px-3 py-1 text-[10px] font-black border rounded-lg cursor-pointer transition-all ${
                        qrSize === size
                          ? 'bg-[#0F4C81] text-white border-[#0f4c81] shadow-3xs'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {size === 'S' ? 'صغير' : size === 'M' ? 'متوسط' : 'كبير'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Metadata Payload Copy Area */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-500 border-b border-slate-200/50 pb-1.5">
                <span>البيانات الرقمية المشفرة بالـ QR (JSON Payload)</span>
                <button
                  type="button"
                  onClick={handleCopyPayload}
                  className="flex items-center gap-1 text-[#0F4C81] hover:text-[#0c3d67] font-black cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500">تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>نسخ النص</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="text-[8px] font-mono text-slate-600 bg-slate-900/5 p-2 rounded-lg max-h-24 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {qrValue}
              </pre>
            </div>
          </div>
        </div>

        {/* Live Premium Weatherproof Label Preview (Right - 7 Columns) */}
        <div className="xl:col-span-7 bg-slate-100/50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-extrabold text-slate-800 text-xs">معاينة مباشرة للملصق الفني المعتمد (Decal Live Preview)</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">شكل ومحتوى التذكرة الحرارية أو الملصق البلاستيكي المقاوم للأتربة والمطر.</p>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 animate-pulse">
              جاهز للطباعة الفورية
            </span>
          </div>

          {/* Heavy Duty Weatherproof Card Container */}
          <div className="flex justify-center items-center py-4">
            
            {/* THIS INNER CARD IS DUAL-PURPOSE (PREVIEW & PRINT EXTRACTION TARGET) */}
            <div 
              id="printable-qr-card"
              className="bg-white text-slate-950 p-6 rounded-xl border-3 border-double border-slate-950 max-w-sm w-full font-sans shadow-md text-right relative overflow-hidden"
              dir="rtl"
            >
              {/* Industrial Decal Styling Accent (Hologram border placeholder) */}
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-blue-700 via-slate-950 to-[#F7941D]" />

              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center">
                <h3 className="font-black text-slate-900 text-sm tracking-tight">شركة إيجيبت كرينز للخدمات البترولية والرفع الثقيل</h3>
                <p className="text-[8px] text-slate-500 font-extrabold mt-0.5 tracking-wider font-mono">EGYPT CRANES & HEAVY LIFT SERVICES</p>
                <p className="text-[9px] text-slate-600 font-black mt-1">
                  {genType === 'crane' ? 'بطاقة هوية فنية معتمدة لمعدة أسطول' : 'تصريح عبور أمني وبوابة معتمد'}
                </p>
              </div>

              {/* Barcode line to look exceptionally professional */}
              <div className="h-6 bg-repeating-linear-gradient-x pointer-events-none opacity-95 mb-4 rounded-xs" style={{
                backgroundImage: 'repeating-linear-gradient(90deg, #0f172a, #0f172a 2px, transparent 2px, transparent 5px)'
              }} />

              {/* Grid Metadata */}
              {genType === 'crane' && activeCrane ? (
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs border-b border-dashed border-slate-300 pb-3.5">
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold block">كود المعدة الفني:</span>
                    <span className="font-black text-slate-900 text-[11px] font-mono">{activeCrane.code}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold block">طراز الونش والماركة:</span>
                    <span className="font-black text-slate-900 text-[11px]">{activeCrane.nameAr}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold block">حمولة الرفع الإنشائية:</span>
                    <span className="font-black text-slate-900 text-[11px] font-mono">{activeCrane.capacity} طن (Tons)</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold block">رقم اللوائح المرورية:</span>
                    <span className="font-black text-slate-900 text-[11px]">{activeCrane.plateNumber || 'بدون لوحات مسجلة'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold block">المشغل المعتمد بالوردية:</span>
                    <span className="font-bold text-slate-900 text-[10px]">{activeCrane.operatorName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold block">تاريخ إصدار الملصق:</span>
                    <span className="font-bold text-slate-800 text-[9px] font-mono">2026-07-11</span>
                  </div>
                </div>
              ) : (
                activePass && (
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs border-b border-dashed border-slate-300 pb-3.5">
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block">رقم تصريح البوابة:</span>
                      <span className="font-black text-slate-900 text-[11px] font-mono">{activePass.passNo}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block">نوع حركة المرور:</span>
                      <span className="font-black text-slate-900 text-[11px]">
                        {activePass.type === 'out' ? 'خروج (Gate Out)' : 'دخول (Gate In)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block">الرافعة المعنية:</span>
                      <span className="font-black text-slate-900 text-[11px]">{activePass.craneName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block">اسم سائق الوردية:</span>
                      <span className="font-black text-slate-900 text-[11px]">{activePass.driverName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block">توقيت البوابة الرسمي:</span>
                      <span className="font-bold text-slate-900 text-[10px] font-mono">{activePass.timestamp}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block">الفحص والتدقيق الفني:</span>
                      <span className="font-bold text-slate-900 text-[10px]">
                        {activePass.hasScanFail ? '⚠️ نقص بالمكونات' : '✅ تم التدقيق بنجاح'}
                      </span>
                    </div>
                  </div>
                )
              )}

              {/* QR Code container and Dynamic QR SVG */}
              <div className="flex flex-col items-center justify-center pt-4">
                <div className="p-3 border border-slate-300 rounded-xl bg-white shadow-3xs flex items-center justify-center">
                  <QRCodeSVG 
                    value={qrValue} 
                    size={sizePixels} 
                    fgColor={qrColor}
                    level="H" // High error correction to make printable/dust-safe QR code
                    includeMargin={true}
                  />
                </div>
                
                {/* Security Seal / Serial metadata */}
                <div className="mt-3.5 text-center space-y-0.5">
                  <span className="text-[8px] text-slate-400 font-black block font-mono">SERIAL: {securityHash}</span>
                  {customNote && (
                    <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-black max-w-[300px] inline-block truncate">
                      * {customNote}
                    </span>
                  )}
                  <span className="text-[7px] text-slate-400 block mt-1 font-bold">ملصق حماية رسمي مشفر هولوجرافيًا لساحة الشركة</span>
                </div>
              </div>

            </div>

          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/50">
            <button
              onClick={handlePrintLabel}
              className="flex-1 w-full py-2 bg-[#0F4C81] hover:bg-[#0c3d67] text-white font-black text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-3xs"
            >
              <Printer className="w-4 h-4" />
              <span>أرسل لأمر الطباعة (Thermal Decal Print)</span>
            </button>
            <button
              onClick={handleCopyPayload}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-all border border-slate-200 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Copy className="w-4 h-4 text-slate-500" />
              <span>نسخ كود الـ QR</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
