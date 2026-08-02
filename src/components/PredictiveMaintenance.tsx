import React, { useState, useEffect } from 'react';
import { Crane, MaintenanceOrder } from '../types';
import { 
  Brain, ShieldAlert, Gauge, TrendingUp, Activity, CheckCircle2, 
  AlertTriangle, Wrench, RefreshCw, Cpu, Sparkles, Plus, Clock, BarChart3, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';

interface PredictiveMaintenanceProps {
  cranes: Crane[];
  orders: MaintenanceOrder[];
  onAddPredictiveOrder: (orderData: {
    craneId: string;
    type: 'preventive' | 'corrective';
    description: string;
    cost: number;
  }) => void;
}

// Simulated dynamic sensor readings for each crane to make it highly interactive and realistic
interface CraneSensors {
  hydraulicPressure: number; // in bar
  oilTemperature: number; // in °C
  vibrationLevel: number; // in mm/s
  wireRopeWear: number; // percentage
  operatingHours: number; // hours since last service
  loadFactor: number; // average load %
}

export default function PredictiveMaintenance({ 
  cranes, 
  orders, 
  onAddPredictiveOrder 
}: PredictiveMaintenanceProps) {
  const [selectedCraneId, setSelectedCraneId] = useState<string>(cranes[0]?.id || '');
  const [isSimulating, setIsSimulating] = useState(true);
  const [simulationTick, setSimulationTick] = useState(0);

  // Initial simulated sensor states for all cranes
  const [sensorData, setSensorData] = useState<Record<string, CraneSensors>>({
    c1: { hydraulicPressure: 212, oilTemperature: 74, vibrationLevel: 2.1, wireRopeWear: 34, operatingHours: 420, loadFactor: 72 },
    c2: { hydraulicPressure: 195, oilTemperature: 68, vibrationLevel: 1.4, wireRopeWear: 18, operatingHours: 150, loadFactor: 58 },
    c3: { hydraulicPressure: 238, oilTemperature: 85, vibrationLevel: 3.8, wireRopeWear: 62, operatingHours: 580, loadFactor: 80 },
    c4: { hydraulicPressure: 254, oilTemperature: 98, vibrationLevel: 5.6, wireRopeWear: 78, operatingHours: 920, loadFactor: 88 },
    c5: { hydraulicPressure: 202, oilTemperature: 71, vibrationLevel: 1.9, wireRopeWear: 22, operatingHours: 290, loadFactor: 64 },
  });

  // Dynamic telemetry history for charts (Simulated last 7 days trends)
  const [telemetryHistory, setTelemetryHistory] = useState<Record<string, Array<{ day: string; pressure: number; temp: number; vibration: number }>>>({
    c1: [
      { day: 'سبت', pressure: 190, temp: 65, vibration: 1.8 },
      { day: 'أحد', pressure: 198, temp: 68, vibration: 1.9 },
      { day: 'إثنين', pressure: 204, temp: 72, vibration: 2.0 },
      { day: 'ثلاثاء', pressure: 210, temp: 73, vibration: 2.1 },
      { day: 'أربعاء', pressure: 208, temp: 75, vibration: 2.2 },
      { day: 'خميس', pressure: 215, temp: 74, vibration: 2.1 },
      { day: 'جمعة', pressure: 212, temp: 74, vibration: 2.1 },
    ],
    c2: [
      { day: 'سبت', pressure: 192, temp: 67, vibration: 1.3 },
      { day: 'أحد', pressure: 195, temp: 66, vibration: 1.4 },
      { day: 'إثنين', pressure: 193, temp: 68, vibration: 1.3 },
      { day: 'ثلاثاء', pressure: 194, temp: 69, vibration: 1.5 },
      { day: 'أربعاء', pressure: 197, temp: 67, vibration: 1.4 },
      { day: 'خميس', pressure: 195, temp: 68, vibration: 1.4 },
      { day: 'جمعة', pressure: 195, temp: 68, vibration: 1.4 },
    ],
    c3: [
      { day: 'سبت', pressure: 210, temp: 75, vibration: 2.8 },
      { day: 'أحد', pressure: 218, temp: 78, vibration: 3.1 },
      { day: 'إثنين', pressure: 224, temp: 80, vibration: 3.2 },
      { day: 'ثلاثاء', pressure: 232, temp: 82, vibration: 3.5 },
      { day: 'أربعاء', pressure: 228, temp: 84, vibration: 3.6 },
      { day: 'خميس', pressure: 235, temp: 83, vibration: 3.7 },
      { day: 'جمعة', pressure: 238, temp: 85, vibration: 3.8 },
    ],
    c4: [
      { day: 'سبت', pressure: 230, temp: 82, vibration: 4.1 },
      { day: 'أحد', pressure: 238, temp: 86, vibration: 4.4 },
      { day: 'إثنين', pressure: 245, temp: 91, vibration: 4.8 },
      { day: 'ثلاثاء', pressure: 250, temp: 93, vibration: 5.1 },
      { day: 'أربعاء', pressure: 252, temp: 96, vibration: 5.3 },
      { day: 'خميس', pressure: 256, temp: 97, vibration: 5.5 },
      { day: 'جمعة', pressure: 254, temp: 98, vibration: 5.6 },
    ],
    c5: [
      { day: 'سبت', pressure: 198, temp: 68, vibration: 1.7 },
      { day: 'أحد', pressure: 202, temp: 70, vibration: 1.8 },
      { day: 'إثنين', pressure: 200, temp: 69, vibration: 1.8 },
      { day: 'ثلاثاء', pressure: 201, temp: 72, vibration: 1.9 },
      { day: 'أربعاء', pressure: 204, temp: 71, vibration: 1.9 },
      { day: 'خميس', pressure: 203, temp: 73, vibration: 2.0 },
      { day: 'جمعة', pressure: 202, temp: 71, vibration: 1.9 },
    ],
  });

  // Periodically fluctuate sensor readings slightly when simulation is active to make it feel alive
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setSensorData(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(craneId => {
          const base = next[craneId];
          // Fluctuate pressure by +/- 3 bar, temp by +/- 1 °C, vibration by +/- 0.1 mm/s
          const pressureDiff = (Math.random() - 0.5) * 4;
          const tempDiff = (Math.random() - 0.5) * 2;
          const vibrationDiff = (Math.random() - 0.5) * 0.3;

          next[craneId] = {
            ...base,
            hydraulicPressure: Math.max(140, Math.min(300, Math.round((base.hydraulicPressure + pressureDiff) * 10) / 10)),
            oilTemperature: Math.max(40, Math.min(120, Math.round((base.oilTemperature + tempDiff) * 10) / 10)),
            vibrationLevel: Math.max(0.5, Math.min(10, Math.round((base.vibrationLevel + vibrationDiff) * 10) / 10)),
            operatingHours: base.operatingHours + 0.1 // hours accumulate
          };
        });
        return next;
      });

      // Update active selected crane history in real-time
      setTelemetryHistory(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(craneId => {
          const currentSensors = sensorData[craneId];
          if (!currentSensors) return;
          const history = [...next[craneId]];
          // Rotate last day value or append a micro fluctuation
          const lastIndex = history.length - 1;
          if (lastIndex >= 0) {
            history[lastIndex] = {
              ...history[lastIndex],
              pressure: currentSensors.hydraulicPressure,
              temp: currentSensors.oilTemperature,
              vibration: currentSensors.vibrationLevel,
            };
          }
          next[craneId] = history;
        });
        return next;
      });

      setSimulationTick(t => t + 1);
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulating, sensorData]);

  // Analyze failure probability and return structural insights for the selected crane
  const getAnalysis = (id: string, s: CraneSensors) => {
    // Basic heuristic models for predictive failure risk
    let score = 100;
    const insights: string[] = [];
    const recommendations: string[] = [];
    const partsNeeded: Array<{ name: string; qty: number; code: string; available: boolean }> = [];
    let estCost = 5000;
    let failureType: 'hydraulic' | 'mechanical' | 'structural' | 'electrical' | 'none' = 'none';

    // 1. Hydraulic Pressure checks
    if (s.hydraulicPressure > 240) {
      score -= 30;
      failureType = 'hydraulic';
      insights.push('تجاوز الضغط الهيدروليكي المسموح به (240 بار) نتيجة لانسداد في فلاتر الزيت أو تضيق الصمامات.');
      recommendations.push('تغيير فلاتر الزيت الهيدروليكي بأسرع وقت وفحص خراطيم الضغط العالي الإيطالية 50 بار.');
      partsNeeded.push({ name: 'خراطيم ضغط عالي هيدروليك إيطالي ٥٠ بار', qty: 5, code: 'EC-INV-HYD-50', available: true });
      partsNeeded.push({ name: 'فلتر ديزل وزيت هيدروليك أصلي', qty: 1, code: 'EC-INV-FLT-D8', available: false }); // low stock
      estCost += 12000;
    } else if (s.hydraulicPressure > 225) {
      score -= 12;
      insights.push('مؤشر الضغط الهيدروليكي مرتفع نسبياً لكنه في الحدود الآمنة مؤقتاً.');
    }

    // 2. Oil Temperature checks
    if (s.oilTemperature > 90) {
      score -= 25;
      failureType = 'hydraulic';
      insights.push('ارتفاع حرج في درجة حرارة زيت التشغيل (فوق 90°م) مما يقلل لزوجة الزيت ويزيد من احتمالية تلف المحابس الهيدروليكية.');
      recommendations.push('تنظيف مبرد الهيدروليك واستبدال الزيت التالف بشحم وزيوت تالكو المقاومة للملوحة.');
      partsNeeded.push({ name: 'شحم تالكو ثقيل هيدروليكس مقاوم للملوحة', qty: 2, code: 'EC-INV-SLR-CL', available: true });
      estCost += 6400;
    } else if (s.oilTemperature > 80) {
      score -= 10;
      insights.push('درجة حرارة الزيت تميل للارتفاع عند التشغيل المستمر تحت أحمال عالية.');
    }

    // 3. Vibration Level checks
    if (s.vibrationLevel > 4.5) {
      score -= 25;
      failureType = 'mechanical';
      insights.push('ارتفاع مستويات الاهتزاز الميكانيكي (فوق 4.5 مم/ث) في رولمان بلي الكابينة والمحاور الرئيسية يهدد السلامة الإنشائية.');
      recommendations.push('شد مسامير التثبيت وإجراء معايرة وفحص فني شامل لقاعدة الونش والمحرك.');
      estCost += 15000;
    } else if (s.vibrationLevel > 3.0) {
      score -= 10;
      insights.push('اهتزازات طفيفة مرصودة في الأجزاء الدوارة يفضل مراجعتها في الصيانة القادمة.');
    }

    // 4. Wire Rope Wear checks
    if (s.wireRopeWear > 65) {
      score -= 20;
      failureType = 'structural';
      insights.push('تجاوز معدل اهتراء حبال الواير الفولاذية 65% مما يشكل خطراً جسيماً عند رفع الحمولات القصوى.');
      recommendations.push('استبدال حبل الواير الفولاذي فوراً لضمان سلامة الرفع ومنع سقوط الأحمال.');
      partsNeeded.push({ name: 'حبل واير فولاذي مضاد للالتواء سمك ١٨ مم', qty: 100, code: 'EC-INV-WRE-18', available: true });
      estCost += 28000;
    } else if (s.wireRopeWear > 45) {
      score -= 8;
      insights.push('حبال الرفع الفولاذية تبدي علامات تآكل متوسطة، يرجى الاستعداد لتغييرها خلال 30 يوم.');
    }

    // 5. Operating hours factor
    if (s.operatingHours > 500) {
      score -= 10;
      insights.push(`تجاوز الونش ${Math.round(s.operatingHours)} ساعة تشغيل دون إجراء صيانة وقائية شاملة.`);
      if (recommendations.length === 0) {
        recommendations.push('جدولة صيانة وقائية دورية لتغيير الفلاتر والزيوت الأساسية.');
        partsNeeded.push({ name: 'فلتر ديزل وزيت أصلي', qty: 2, code: 'EC-INV-FLT-D8', available: true });
        estCost += 3700;
      }
    }

    // Adjust score limits
    score = Math.max(12, Math.min(100, score));

    // Determine general risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (score < 55) {
      riskLevel = 'high';
    } else if (score < 80) {
      riskLevel = 'medium';
    }

    // Default messages if everything is perfect
    if (insights.length === 0) {
      insights.push('جميع مؤشرات الحساسات والتشغيل في المستويات المثالية والخضراء.');
    }
    if (recommendations.length === 0) {
      recommendations.push('لا توجد إجراءات طارئة مطلوبة. استمر في الصيانة الوقائية المجدولة.');
    }

    return {
      score,
      riskLevel,
      insights,
      recommendations,
      partsNeeded,
      estCost,
      failureType,
    };
  };

  const selectedCrane = cranes.find(c => c.id === selectedCraneId) || cranes[0];
  const activeSensors = sensorData[selectedCraneId] || { hydraulicPressure: 200, oilTemperature: 70, vibrationLevel: 1.8, wireRopeWear: 25, operatingHours: 300, loadFactor: 60 };
  const analysis = getAnalysis(selectedCraneId, activeSensors);

  // Radar data for components health summary
  const radarData = [
    { subject: 'الهيدروليك', value: Math.max(20, 100 - (activeSensors.hydraulicPressure > 240 ? 60 : activeSensors.hydraulicPressure > 220 ? 30 : 0)) },
    { subject: 'التبريد والزيت', value: Math.max(20, 100 - (activeSensors.oilTemperature > 90 ? 55 : activeSensors.oilTemperature > 75 ? 25 : 0)) },
    { subject: 'الميكانيكا والاتزان', value: Math.max(20, 100 - (activeSensors.vibrationLevel > 4.5 ? 50 : activeSensors.vibrationLevel > 3 ? 20 : 0)) },
    { subject: 'سلامة الوايرات', value: Math.max(20, 100 - (activeSensors.wireRopeWear > 65 ? 70 : activeSensors.wireRopeWear > 40 ? 30 : 0)) },
    { subject: 'ساعات التشغيل', value: Math.max(20, 100 - (activeSensors.operatingHours > 800 ? 50 : activeSensors.operatingHours > 500 ? 25 : 0)) },
    { subject: 'كفاءة استهلاك الوقود', value: selectedCrane?.fuelLevel || 80 },
  ];

  return (
    <div className="space-y-6 font-sans text-right dir-rtl" dir="rtl">
      
      {/* Top Banner Alert / Welcome */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-850 to-[#0F4C81] text-white rounded-3xl p-6 shadow-md border border-slate-800">
        <div className="absolute top-[-40px] left-[-40px] w-32 h-32 rounded-full bg-[#F7941D]/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-30px] right-[20%] w-48 h-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-amber-400 animate-pulse" />
              </span>
              <h2 className="text-xl font-extrabold tracking-tight">محرك التنبؤ بالأعطال والتحليل الذكي (Predictive Maintenance AI)</h2>
            </div>
            <p className="text-xs text-slate-300 font-medium max-w-2xl leading-relaxed">
              يقوم النظام بتحليل فوري لأجهزة القياس وأسطول الأوناش من خلال ربط الحساسات وساعات التشغيل ببيانات البوابة والتشغيل التاريخية، لتوقع احتمال حدوث الأعطال الهيدروليكية أو الميكانيكية أو الهيكلية قبل وقوعها بـ 15 يوماً.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 self-start md:self-auto">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-300 block font-bold">حالة محاكاة الحساسات الحية:</span>
              <span className="text-xs font-black flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${isSimulating ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
                {isSimulating ? 'نشطة وتتلقى الإشارات الآن' : 'متوقفة مؤقتاً'}
              </span>
            </div>
            <button 
              onClick={() => setIsSimulating(!isSimulating)}
              className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isSimulating 
                  ? 'bg-rose-600/30 text-rose-200 border-rose-500/30 hover:bg-rose-600/50' 
                  : 'bg-emerald-600/30 text-emerald-200 border-emerald-500/30 hover:bg-emerald-600/50'
              }`}
            >
              {isSimulating ? 'إيقاف المحاكاة' : 'تفعيل البث الحقيقي'}
            </button>
          </div>
        </div>
      </div>

      {/* Fleet Overview Grid / Risk Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left list of all cranes with their predictive risk level */}
        <div className="lg:col-span-1 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#0F4C81]" />
              <span>قائمة فحص المخاطر لأسطول الأوناش</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">مجموع: {cranes.length} أوناش</span>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {cranes.map(crane => {
              const sensors = sensorData[crane.id] || { hydraulicPressure: 200, oilTemperature: 70, vibrationLevel: 1.8, wireRopeWear: 25, operatingHours: 300, loadFactor: 60 };
              const cranAnalysis = getAnalysis(crane.id, sensors);
              const isSelected = crane.id === selectedCraneId;

              return (
                <button
                  key={crane.id}
                  onClick={() => setSelectedCraneId(crane.id)}
                  className={`w-full text-right p-3.5 rounded-2xl transition-all border flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected 
                      ? 'bg-[#0F4C81]/5 border-[#0F4C81] shadow-2xs' 
                      : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="space-y-1 truncate flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-xs text-slate-800">{crane.code}</span>
                      <span className="text-[10px] text-slate-400 font-bold truncate">| {crane.model}</span>
                    </div>
                    <div className="font-extrabold text-xs text-slate-900 truncate">{crane.nameAr}</div>
                    
                    {/* Tiny Health progress bar */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-1.5 bg-slate-200 rounded-full flex-1 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            cranAnalysis.riskLevel === 'high' ? 'bg-rose-500' :
                            cranAnalysis.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${cranAnalysis.score}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono font-black text-slate-600">{cranAnalysis.score}% صحة</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black border uppercase tracking-wide ${
                      cranAnalysis.riskLevel === 'high' ? 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse' :
                      cranAnalysis.riskLevel === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                      {cranAnalysis.riskLevel === 'high' ? 'خطورة مرتفعة 🚨' :
                       cranAnalysis.riskLevel === 'medium' ? 'خطورة متوسطة ⚠️' : 'آمن تماماً ✓'}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-slate-400">
                      {Math.round(sensors.operatingHours)} س تشغيل
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center/Right Details and Real-time gauges */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          
          {/* Selected Crane Header info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-[#0F4C81]/10 text-[#0F4C81] px-2.5 py-1 rounded-xl text-xs font-black font-mono">
                  {selectedCrane?.code}
                </span>
                <span className="text-xs text-slate-500 font-bold">مشغل بواسطة: {selectedCrane?.operatorName}</span>
              </div>
              <h3 className="font-extrabold text-base text-slate-900">{selectedCrane?.nameAr}</h3>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
              <div className="text-left font-mono">
                <span className="text-[10px] text-slate-400 block font-bold text-right">مؤشر الفشل التنبؤي</span>
                <span className={`text-base font-black ${
                  analysis.riskLevel === 'high' ? 'text-rose-600' :
                  analysis.riskLevel === 'medium' ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {analysis.score}%
                </span>
                <span className="text-[10px] text-slate-500 font-bold"> (معدل السلامة المتوقع)</span>
              </div>
            </div>
          </div>

          {/* Interactive Gauges Panel */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* Hydraulic Pressure Gauge */}
            <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100 text-center space-y-1.5 relative overflow-hidden">
              {activeSensors.hydraulicPressure > 240 && <div className="absolute top-0 right-0 left-0 h-1 bg-rose-500" />}
              <span className="text-[10px] text-slate-500 font-bold block">الضغط الهيدروليكي</span>
              <p className="font-mono text-base font-black text-slate-800">
                {activeSensors.hydraulicPressure} <span className="text-[10px] font-normal text-slate-400">بار</span>
              </p>
              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black ${
                activeSensors.hydraulicPressure > 240 ? 'bg-rose-100 text-rose-700' :
                activeSensors.hydraulicPressure > 220 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {activeSensors.hydraulicPressure > 240 ? 'حرج' : activeSensors.hydraulicPressure > 220 ? 'مستقر مرتفع' : 'طبيعي'}
              </span>
            </div>

            {/* Oil Temp Gauge */}
            <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100 text-center space-y-1.5 relative overflow-hidden">
              {activeSensors.oilTemperature > 90 && <div className="absolute top-0 right-0 left-0 h-1 bg-rose-500" />}
              <span className="text-[10px] text-slate-500 font-bold block">حرارة زيت المحرك والـ Gear</span>
              <p className="font-mono text-base font-black text-slate-800">
                {activeSensors.oilTemperature} <span className="text-[10px] font-normal text-slate-400">°م</span>
              </p>
              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black ${
                activeSensors.oilTemperature > 90 ? 'bg-rose-100 text-rose-700' :
                activeSensors.oilTemperature > 78 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {activeSensors.oilTemperature > 90 ? 'حرارة زائدة' : activeSensors.oilTemperature > 78 ? 'متوسط مرتفع' : 'طبيعي'}
              </span>
            </div>

            {/* Vibration Gauge */}
            <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100 text-center space-y-1.5 relative overflow-hidden">
              {activeSensors.vibrationLevel > 4.5 && <div className="absolute top-0 right-0 left-0 h-1 bg-rose-500" />}
              <span className="text-[10px] text-slate-500 font-bold block">الاهتزاز الميكانيكي</span>
              <p className="font-mono text-base font-black text-slate-800">
                {activeSensors.vibrationLevel} <span className="text-[10px] font-normal text-slate-400">مم/ث</span>
              </p>
              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black ${
                activeSensors.vibrationLevel > 4.5 ? 'bg-rose-100 text-rose-700' :
                activeSensors.vibrationLevel > 3.0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {activeSensors.vibrationLevel > 4.5 ? 'مستويات تآكل' : activeSensors.vibrationLevel > 3.0 ? 'مراقبة ضرورية' : 'آمن ومستقر'}
              </span>
            </div>

            {/* Wire Rope Wear Gauge */}
            <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100 text-center space-y-1.5 relative overflow-hidden">
              {activeSensors.wireRopeWear > 65 && <div className="absolute top-0 right-0 left-0 h-1 bg-rose-500" />}
              <span className="text-[10px] text-slate-500 font-bold block">اهتراء حبال الواير</span>
              <p className="font-mono text-base font-black text-slate-800">
                {activeSensors.wireRopeWear}% <span className="text-[10px] font-normal text-slate-400">تآكل</span>
              </p>
              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black ${
                activeSensors.wireRopeWear > 65 ? 'bg-rose-100 text-rose-700' :
                activeSensors.wireRopeWear > 45 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {activeSensors.wireRopeWear > 65 ? 'تغيير فوري' : activeSensors.wireRopeWear > 45 ? 'تجهيز بديل' : 'سليم وفحص دوري'}
              </span>
            </div>

          </div>

          {/* Charts and Failure Probability Radar in side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Real-time telemetry graph */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
              <span className="text-xs font-extrabold text-slate-700 block flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-[#0F4C81]" />
                <span>مسار تغير الضغط والحرارة (آخر 7 أيام)</span>
              </span>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={telemetryHistory[selectedCraneId] || []}
                    margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorPressure" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F4C81" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0F4C81" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F7941D" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#F7941D" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0"/>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                    <Tooltip contentStyle={{ fontSize: 10, textAlign: 'right' }} />
                    <Area type="monotone" name="الضغط (بار)" dataKey="pressure" stroke="#0F4C81" strokeWidth={2} fillOpacity={1} fill="url(#colorPressure)" />
                    <Area type="monotone" name="الحرارة (°م)" dataKey="temp" stroke="#F7941D" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar component health analysis */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
              <span className="text-xs font-extrabold text-slate-700 block flex items-center gap-1">
                <Gauge className="w-4 h-4 text-emerald-600" />
                <span>تقييم كفاءة الأنظمة والقطع التخصصية</span>
              </span>
              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#CBD5E1" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#475569', fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                    <Radar 
                      name="مؤشر الكفاءة" 
                      dataKey="value" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.2} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* AI Insights & Recommendation block */}
          <div className="bg-[#0F4C81]/5 border border-[#0F4C81]/15 rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1">
                <h4 className="font-extrabold text-xs text-[#0F4C81] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#0F4C81]" />
                  <span>التقرير التحليلي الفني المتوقع للرافعة</span>
                </h4>
                
                {/* Insights List */}
                <ul className="space-y-2 pt-2">
                  {analysis.insights.map((insight, idx) => (
                    <li key={idx} className="text-xs text-slate-700 font-bold flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0F4C81] mt-1.5 flex-shrink-0" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>

                {/* Recommendations */}
                <div className="pt-3 border-t border-slate-100 mt-3 space-y-1.5">
                  <span className="text-[10px] text-slate-400 block font-bold">التوصية المباشرة المعتمدة بالذكاء الاصطناعي:</span>
                  {analysis.recommendations.map((rec, idx) => (
                    <div key={idx} className="text-xs text-emerald-800 font-extrabold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Area */}
              <div className="flex flex-col items-stretch justify-center gap-3 w-48 flex-shrink-0 bg-white p-3.5 rounded-xl border border-slate-100 shadow-3xs text-center">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 block font-bold">تكلفة الصيانة التقديرية</span>
                  <span className="font-mono text-xs font-black text-[#0F4C81]">{analysis.estCost.toLocaleString()} ج.م</span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 block font-bold">احتمال الفشل (15 يوماً)</span>
                  <span className={`text-xs font-black ${
                    analysis.riskLevel === 'high' ? 'text-rose-600' :
                    analysis.riskLevel === 'medium' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {analysis.riskLevel === 'high' ? '84%' : analysis.riskLevel === 'medium' ? '42%' : '4%'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onAddPredictiveOrder({
                    craneId: selectedCraneId,
                    type: analysis.failureType === 'hydraulic' || analysis.failureType === 'mechanical' ? 'corrective' : 'preventive',
                    description: `[أمر شغل تنبؤي ذكي بناءً على تحليل الحساسات]: ${analysis.recommendations[0]} لتجنب تلف في نظام ${analysis.failureType === 'hydraulic' ? 'الهيدروليك والضغط' : analysis.failureType === 'mechanical' ? 'الميكانيكا والمحرك' : 'الرافعات والواير'}.`,
                    cost: analysis.estCost
                  })}
                  className="w-full py-2 bg-[#0F4C81] hover:bg-[#0c3d67] text-white text-[10px] font-black rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Wrench className="w-3 h-3" /> جدولة صيانة استباقية
                </button>
              </div>
            </div>

            {/* Spare Parts checking segment */}
            {analysis.partsNeeded.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[10px] text-slate-400 block font-black">تفقد وفرة قطع الغيار المطلوبة بالمخزن ورشة الجيزة:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {analysis.partsNeeded.map((part, pIdx) => (
                    <div key={pIdx} className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-150 flex items-center justify-between text-[10px]">
                      <span className="font-extrabold text-slate-700 truncate max-w-[180px]">{part.name}</span>
                      <span className="font-mono text-slate-400 text-[9px] px-1">({part.code})</span>
                      <span className={`font-bold px-1.5 py-0.5 rounded ${part.available ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700 animate-pulse'}`}>
                        {part.available ? `متوفر (طلب ${part.qty})` : `تحذير: نقص بالمخزون`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
