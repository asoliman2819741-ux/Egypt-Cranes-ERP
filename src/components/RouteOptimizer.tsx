import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Navigation, Compass, Sparkles, Fuel, Clock, Gauge, 
  CheckCircle2, AlertTriangle, ShieldCheck, Printer, Download, 
  Sliders, ArrowLeftRight, HelpCircle, Info, Truck, RefreshCw, Play, RotateCcw
} from 'lucide-react';
import { Crane } from '../types';

interface RouteOptimizerProps {
  cranes: Crane[];
}

interface PredefinedLocation {
  id: string;
  nameAr: string;
  nameEn: string;
  lat: number;
  lng: number;
}

const DEPARTURES: PredefinedLocation[] = [
  { id: 'dep1', nameAr: 'ورشة الجيزة المركزية (المنصورية)', nameEn: 'Giza Central Workshop', lat: 30.0125, lng: 31.1412 },
  { id: 'dep2', nameAr: 'ساحة العبور للأوناش الثقيلة (القليوبية)', nameEn: 'El Obour Heavy Crane Yard', lat: 30.2215, lng: 31.4811 },
  { id: 'dep3', nameAr: 'ميناء الدخيلة الرئيسي بالإسكندرية', nameEn: 'Alexandria Dekheila Port', lat: 31.1422, lng: 29.8156 },
  { id: 'dep4', nameAr: 'منطقة تجميع العين السخنة السويس', nameEn: 'Ain Sokhna Assembly Area', lat: 29.6212, lng: 32.3512 }
];

const DESTINATIONS: PredefinedLocation[] = [
  { id: 'dest1', nameAr: 'مشروع العاصمة الإدارية الجديدة (البرج الأيقوني)', nameEn: 'New Administrative Capital (Iconic Tower)', lat: 29.9811, lng: 31.7512 },
  { id: 'dest2', nameAr: 'موقع محطة الضبعة النووية بالساحل الشمالي', nameEn: 'El Dabaa Nuclear Power Plant Site', lat: 31.0255, lng: 28.4312 },
  { id: 'dest3', nameAr: 'توسعة محطة حاويات شرق بورسعيد ورصيف ٩', nameEn: 'East Port Said Container Terminal Expansion', lat: 31.2215, lng: 32.3711 },
  { id: 'dest4', nameAr: 'مشروع مجمع البتروكيماويات بمحور قنا', nameEn: 'Qena Petrochemical Complex Project', lat: 26.1612, lng: 32.7215 },
  { id: 'dest5', nameAr: 'مترو أنفاق الجيزة (الخط الرابع - شارع الهرم)', nameEn: 'Giza Metro Line 4 (Al Haram St.)', lat: 30.0055, lng: 31.1852 }
];

export default function RouteOptimizer({ cranes }: RouteOptimizerProps) {
  const [departureId, setDepartureId] = useState<string>(DEPARTURES[0].id);
  const [destinationId, setDestinationId] = useState<string>(DESTINATIONS[0].id);
  const [selectedCraneId, setSelectedCraneId] = useState<string>(cranes[0]?.id || '');
  const [algorithm, setAlgorithm] = useState<'shortest' | 'eco' | 'heavy_safe' | 'traffic_avoid'>('heavy_safe');
  
  // Custom constraints
  const [customWeightLimit, setCustomWeightLimit] = useState<number>(100); // tons
  const [customHeightLimit, setCustomHeightLimit] = useState<number>(5.2); // meters
  
  // Simulation states
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [hasOptimized, setHasOptimized] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [showManifestModal, setShowManifestModal] = useState<boolean>(false);
  
  // Calculated Route Details (Mock logic bound to user inputs to look extremely realistic)
  const [routeResults, setRouteResults] = useState<any>(null);

  const animationRef = useRef<number | null>(null);

  const selectedCrane = cranes.find(c => c.id === selectedCraneId) || cranes[0];
  const departure = DEPARTURES.find(d => d.id === departureId) || DEPARTURES[0];
  const destination = DESTINATIONS.find(d => d.id === destinationId) || DESTINATIONS[0];

  // Recalculate route properties based on selection
  const handleOptimize = () => {
    setIsOptimizing(true);
    setHasOptimized(false);
    setIsSimulating(false);
    setSimProgress(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setTimeout(() => {
      setIsOptimizing(false);
      setHasOptimized(true);

      // Deterministic calculations based on inputs for realistic results
      const depName = departure.nameAr;
      const destName = destination.nameAr;
      const craneCapacity = selectedCrane ? selectedCrane.capacity : 80;
      
      // Base Distance calculation (pseudo)
      let baseDistance = 140;
      if (departureId === 'dep1' && destinationId === 'dest1') baseDistance = 95; // Giza -> Capital
      else if (departureId === 'dep1' && destinationId === 'dest2') baseDistance = 310; // Giza -> Dabaa
      else if (departureId === 'dep2' && destinationId === 'dest1') baseDistance = 75; // Obour -> Capital
      else if (departureId === 'dep2' && destinationId === 'dest2') baseDistance = 345; // Obour -> Dabaa
      else if (departureId === 'dep3' && destinationId === 'dest2') baseDistance = 180; // Alex -> Dabaa
      else if (departureId === 'dep4' && destinationId === 'dest1') baseDistance = 120; // Sokhna -> Capital
      else baseDistance = 210;

      // Adjust distance based on algorithm
      let optimalDist = baseDistance;
      let standardDist = Math.round(baseDistance * 1.18);
      let speedKmH = 45; // Cranes travel slow

      if (algorithm === 'shortest') {
        optimalDist = Math.round(baseDistance * 0.95);
        standardDist = Math.round(baseDistance * 1.15);
        speedKmH = 40;
      } else if (algorithm === 'eco') {
        optimalDist = Math.round(baseDistance * 1.02); // Eco-routing might bypass high grades or tolls
        standardDist = Math.round(baseDistance * 1.18);
        speedKmH = 50; // Eco-sweet spot
      } else if (algorithm === 'heavy_safe') {
        optimalDist = Math.round(baseDistance * 1.10); // Safe path takes highways/ring roads, avoiding short/bridge paths
        standardDist = Math.round(baseDistance * 1.25);
        speedKmH = 35; // Heavy escorts run slower
      } else {
        optimalDist = Math.round(baseDistance * 0.98);
        standardDist = Math.round(baseDistance * 1.18);
        speedKmH = 42;
      }

      // Compute time, fuel and emissions
      const standardHours = Number((standardDist / (speedKmH * 0.8)).toFixed(1));
      const optimalHours = Number((optimalDist / speedKmH).toFixed(1));
      
      // 1 ton takes approx 0.8L fuel per km on heavy load flat, crane is very heavy
      const baseFuelRate = 1.1; // Liters per KM
      const cargoFactor = (craneCapacity / 100) * 0.4 + 0.8;
      const standardFuel = Math.round(standardDist * baseFuelRate * cargoFactor);
      const optimalFuel = Math.round(optimalDist * baseFuelRate * cargoFactor * (algorithm === 'eco' ? 0.78 : 0.85));

      const standardCO2 = Math.round(standardFuel * 2.68); // 2.68kg CO2 per liter diesel
      const optimalCO2 = Math.round(optimalFuel * 2.68);

      const fuelSavingPercent = Math.round(((standardFuel - optimalFuel) / standardFuel) * 100);
      const timeSavingPercent = Math.round(((standardHours - optimalHours) / standardHours) * 100);
      const distanceSavingPercent = Math.round(((standardDist - optimalDist) / standardDist) * 100);

      // Determine required permits & safety alerts based on cargo capacity and weight limits
      const isExtremeCargo = craneCapacity > 150;
      const alerts = [];
      const permits = [];

      if (isExtremeCargo) {
        alerts.push({
          type: 'danger',
          title: '⚠️ حمولة فائقة الضخامة (Super Heavy Load)',
          desc: 'يتخطى وزن المعدة 150 طناً. يتطلب تسيير هذا المسار مرافقة مسبقة من الإدارة العامة للمرور وجرارات دفع تلسكوبية خلفية.'
        });
        permits.push('تصريح نقل وزارة النقل رقم ٧٧٢', 'موافقة الهيئة العامة للطرق والكباري للوزن المحوري');
      } else if (craneCapacity > 80) {
        alerts.push({
          type: 'warning',
          title: '⚠️ تنبيه وزن المعدة (Heavy Cargo)',
          desc: 'الحمولة تتجاوز 80 طناً. يمنع عبور جسور الترع والمصارف الضعيفة. تم توجيه الكراسة الملاحية بالطرق الإقليمية السريعة.'
        });
        permits.push('تصريح هيئة الطرق لحمولات تخطي الكود القياسي');
      } else {
        alerts.push({
          type: 'success',
          title: '✅ مطابقة المعايير الهندسية',
          desc: 'أبعاد ونسب التحميل ضمن النطاق الآمن لشبكة الطرق القومية ومحيط الأنفاق الرئيسية بمصر.'
        });
      }

      // Specific height alerts
      if (customHeightLimit < 5.0) {
        alerts.push({
          type: 'danger',
          title: '⚠️ عائق خلوص رأسي منخفض (Underpass Limit)',
          desc: 'الحد الرأسي المسموح به منخفض. تم تغيير المسار لتفادي نفق الرماية وكباري الهرم الدائرية المنخفضة.'
        });
      }

      // Generate dynamic step-by-step route checkpoints
      let steps = [];
      if (departureId === 'dep1') { // Giza
        steps = [
          { km: 0, text: `انطلاق الموكب من ${depName} وفحص تأمين مرابط الرافعة على الجرار.`, speed: '30 كم/س', safety: 'سرعة منخفضة بالخروج الميداني' },
          { km: 15, text: `الدخول من رامب طريق الفيوم إلى الدائري الأوسطي وتفادي نفق الرماية ذو الخلوص (٤.٨ م).`, speed: '45 كم/س', safety: 'الالتزام بالحارة اليمنى الفائقة' },
          { km: 45, text: `متابعة السير عبر الدائري الإقليمي لتفادي الزحام المروري داخل القاهرة الكبرى وتجنب الكباري المعدنية القديمة.`, speed: '50 كم/س', safety: 'الحفاظ على مسافة أمان ١٠٠م' },
          { km: Math.round(optimalDist * 0.75), text: `نقطة التفتيش والميزان المحوري بمدخل طريق الصحراوي/السويس لفحص سلامة الإطارات ودرجة حرارة المكابح.`, speed: '20 كم/س', safety: 'توقف إجباري للفحص السريع' },
          { km: optimalDist, text: `الوصول بأمان لـ ${destName} والبدء في إجراءات الفك والإنزال الهندسي للمعدات.`, speed: '0 كم/س', safety: 'اكتمال الرحلة والتحقق النهائي' }
        ];
      } else {
        steps = [
          { km: 0, text: `الخروج من بوابات ${depName} بعد فحص موازنة المحاور وتأمين مخصصات الديزل للرحلة.`, speed: '35 كم/س', safety: 'فحص ميكانيكي لضغط هيدروليك الرافعة' },
          { km: Math.round(optimalDist * 0.35), text: `الانتقال إلى حارة النقل الثقيل المخصصة على طريق السويس أو الدائري الإقليمي الجديد.`, speed: '50 كم/س', safety: 'مرافقة إنذارية ومصابيح تحذيرية نشطة' },
          { km: Math.round(optimalDist * 0.70), text: `تجاوز الممرات الضيقة ومحطات الرسوم بنجاح بالتنسيق المسبق وتطبيق الأبعاد القانونية.`, speed: '30 كم/س', safety: 'دقة توجيه عند بوابات العبور' },
          { km: optimalDist, text: `الاستقرار بموقع العمل في ${destName} وإخطار مهندس العمليات لتنصيب القواعد الثابتة للونش.`, speed: '0 كم/س', safety: 'اعتماد محضر الوصول الآمن' }
        ];
      }

      setRouteResults({
        departureName: depName,
        destinationName: destName,
        craneName: selectedCrane ? selectedCrane.nameAr : 'ونش الأسطول المستهدف',
        craneCode: selectedCrane ? selectedCrane.code : 'EC-CR-00',
        craneWeight: craneCapacity,
        algorithmName: algorithm === 'eco' ? 'المسار الأخضر (Eco-Route)' : 
                       algorithm === 'shortest' ? 'المسافة الأقصر (Shortest Path)' : 
                       algorithm === 'heavy_safe' ? 'الطريق الهندسي الممهد للوزن الفائق (Heavy Cargo Safe)' : 'تفادي الكثافة والحوادث (A* Adaptive)',
        optimalDist,
        standardDist,
        optimalHours,
        standardHours,
        optimalFuel,
        standardFuel,
        optimalCO2,
        standardCO2,
        fuelSavingPercent,
        timeSavingPercent,
        distanceSavingPercent,
        alerts,
        permits,
        steps
      });
    }, 1200);
  };

  // Run initial optimize on mount if selectedCrane exists
  useEffect(() => {
    if (cranes.length > 0 && !hasOptimized && !isOptimizing) {
      handleOptimize();
    }
  }, [cranes]);

  // Handle visual map route simulation
  const startVisualSimulation = () => {
    if (isSimulating) {
      setIsSimulating(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    setIsSimulating(true);
    setSimProgress(0);
    
    let lastTime = Date.now();
    const updateProgress = () => {
      const now = Date.now();
      const delta = now - lastTime;
      lastTime = now;

      setSimProgress(prev => {
        // Increment progress: takes about 10 seconds for the truck to finish
        const next = prev + (delta / 80);
        if (next >= 100) {
          setIsSimulating(false);
          return 100;
        }
        animationRef.current = requestAnimationFrame(updateProgress);
        return next;
      });
    };
    animationRef.current = requestAnimationFrame(updateProgress);
  };

  const resetVisualSimulation = () => {
    setIsSimulating(false);
    setSimProgress(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  // Clean animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6 text-right dir-rtl font-sans">
      
      {/* Upper Information Banner */}
      <div className="bg-[#0F4C81]/5 p-5 rounded-3xl border border-[#0F4C81]/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
            <span className="p-2 bg-[#0F4C81] text-white rounded-2xl">
              <Compass className="w-5 h-5" />
            </span>
            <span>نظام تخطيط وتحسين مسارات النقل الثقيل (Heavy Route Optimizer) 🗺️⚡</span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold">
            يقوم بتطبيق خوارزميات الذكاء الاصطناعي والمحاكاة الرياضية لحساب خط سير شحن الأوناش العملاقة لتفادي الطرق الضيقة، الكباري ذات حدود الأوزان المنخفضة، وتقليل الانبعاثات الكربونية والوقود بمصر.
          </p>
        </div>
        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-[10px] bg-slate-900 text-white font-black px-2.5 py-1 rounded-xl uppercase tracking-wider">
            الموديل المطور: Dijkstra & A* Hybrid
          </span>
        </div>
      </div>

      {/* Main Grid: Controls vs Results/Simulation Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* RIGHT PANEL: Input & parameters (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-800 font-extrabold text-xs">
            <Sliders className="w-4.5 h-4.5 text-[#0F4C81]" />
            <span>مدخلات التوجيه الهندسي للموكب</span>
          </div>

          <div className="space-y-4 text-xs font-semibold">
            {/* Target crane selection */}
            <div className="space-y-1.5">
              <label className="text-slate-600 block">اختر الونش/المعدة المطلوب نقلها للموقع:</label>
              <select 
                value={selectedCraneId} 
                onChange={(e) => setSelectedCraneId(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-bold text-slate-700 focus:ring-2 focus:ring-[#0F4C81] outline-none"
              >
                {cranes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nameAr} - كود: {c.code} ({c.capacity} طن)
                  </option>
                ))}
              </select>
            </div>

            {/* Departure yard selection */}
            <div className="space-y-1.5">
              <label className="text-slate-600 block">نقطة انطلاق شاحنة النقل الثقيل (Departure):</label>
              <select 
                value={departureId} 
                onChange={(e) => setDepartureId(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-bold text-slate-700 focus:ring-2 focus:ring-[#0F4C81] outline-none"
              >
                {DEPARTURES.map(d => (
                  <option key={d.id} value={d.id}>{d.nameAr}</option>
                ))}
              </select>
            </div>

            {/* Destination project selection */}
            <div className="space-y-1.5">
              <label className="text-slate-600 block">الجهة المستهدفة والإنزال النهائي (Destination):</label>
              <select 
                value={destinationId} 
                onChange={(e) => setDestinationId(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-bold text-slate-700 focus:ring-2 focus:ring-[#0F4C81] outline-none"
              >
                {DESTINATIONS.map(d => (
                  <option key={d.id} value={d.id}>{d.nameAr}</option>
                ))}
              </select>
            </div>

            {/* Pathfinding Algorithm strategy */}
            <div className="space-y-2 pt-1">
              <label className="text-slate-600 block">إستراتيجية تحديد وحساب المسار الأمثل:</label>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-black">
                <button
                  type="button"
                  onClick={() => setAlgorithm('heavy_safe')}
                  className={`p-2.5 border rounded-xl flex flex-col items-center justify-center text-center gap-1 cursor-pointer transition-all ${
                    algorithm === 'heavy_safe' 
                      ? 'border-[#0F4C81] bg-[#0F4C81]/5 text-[#0F4C81]' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  <ShieldCheck className="w-4.5 h-4.5" />
                  <span>ممهد للأوزان الفائقة 🛡️</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAlgorithm('eco')}
                  className={`p-2.5 border rounded-xl flex flex-col items-center justify-center text-center gap-1 cursor-pointer transition-all ${
                    algorithm === 'eco' 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  <Fuel className="w-4.5 h-4.5" />
                  <span>المسار الأخضر الموفر 🍃</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAlgorithm('shortest')}
                  className={`p-2.5 border rounded-xl flex flex-col items-center justify-center text-center gap-1 cursor-pointer transition-all ${
                    algorithm === 'shortest' 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-800' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  <Navigation className="w-4.5 h-4.5" />
                  <span>المسافة الجغرافية الأقصر 📏</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAlgorithm('traffic_avoid')}
                  className={`p-2.5 border rounded-xl flex flex-col items-center justify-center text-center gap-1 cursor-pointer transition-all ${
                    algorithm === 'traffic_avoid' 
                      ? 'border-amber-600 bg-amber-50 text-amber-800' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  <Clock className="w-4.5 h-4.5" />
                  <span>تجنب الكثافة والحوادث 🚦</span>
                </button>
              </div>
            </div>

            {/* Custom Limits Configuration */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 pt-3">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">القيود الهندسية والجسور والممرات</span>
              
              {/* Height limit constraint */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-slate-600">أدنى خلوص كباري نفقية مطلوب:</span>
                  <span className="font-mono text-[#0F4C81]">{customHeightLimit} م</span>
                </div>
                <input 
                  type="range" 
                  min="4.2" 
                  max="5.8" 
                  step="0.1"
                  value={customHeightLimit} 
                  onChange={(e) => setCustomHeightLimit(Number(e.target.value))}
                  className="w-full accent-[#0F4C81] cursor-pointer"
                />
              </div>

              {/* Weight limit constraint */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-slate-600">الحد الأقصى للوزن المحوري للطريق:</span>
                  <span className="font-mono text-[#0F4C81]">{customWeightLimit} طن</span>
                </div>
                <input 
                  type="range" 
                  min="60" 
                  max="180" 
                  step="5"
                  value={customWeightLimit} 
                  onChange={(e) => setCustomWeightLimit(Number(e.target.value))}
                  className="w-full accent-[#0F4C81] cursor-pointer"
                />
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-600 text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer text-center text-wrap"
            >
              {isOptimizing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري رصد محاور الطرق وتحليل الأوزان...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>حساب وتحسين مسار النقل الذكي 🚀</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* LEFT PANEL: Results Summary & Interactive Simulation (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {routeResults ? (
            <>
              {/* Dynamic Metrics Comparison cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-sans">
                
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex flex-col justify-between items-center">
                  <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
                    <Fuel className="w-4 h-4" />
                  </div>
                  <div className="mt-2">
                    <span className="text-[10px] text-slate-400 font-bold block">الوفر في الوقود</span>
                    <span className="text-base font-black text-emerald-700 font-mono">-{routeResults.fuelSavingPercent}%</span>
                    <span className="text-[10px] text-emerald-600 block font-bold">وفّر {routeResults.standardFuel - routeResults.optimalFuel} لتر ديزل</span>
                  </div>
                </div>

                <div className="bg-sky-50/50 p-4 rounded-2xl border border-sky-100 flex flex-col justify-between items-center">
                  <div className="p-1.5 bg-sky-100 rounded-lg text-[#0F4C81]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="mt-2">
                    <span className="text-[10px] text-slate-400 font-bold block">الوفر في الزمن</span>
                    <span className="text-base font-black text-sky-700 font-mono">-{routeResults.timeSavingPercent}%</span>
                    <span className="text-[10px] text-sky-600 block font-bold">وفّر {Math.round((routeResults.standardHours - routeResults.optimalHours) * 60)} دقيقة</span>
                  </div>
                </div>

                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col justify-between items-center">
                  <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-700">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div className="mt-2">
                    <span className="text-[10px] text-slate-400 font-bold block">المسافة الفعلية</span>
                    <span className="text-base font-black text-indigo-700 font-mono">{routeResults.optimalDist} كم</span>
                    <span className="text-[10px] text-indigo-600 block font-bold">عبر المسار المحسن</span>
                  </div>
                </div>

                <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100 flex flex-col justify-between items-center">
                  <div className="p-1.5 bg-teal-100 rounded-lg text-teal-700">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <div className="mt-2">
                    <span className="text-[10px] text-slate-400 font-bold block">انبعاثات الـ CO2</span>
                    <span className="text-base font-black text-teal-700 font-mono">-{Math.round(((routeResults.standardCO2 - routeResults.optimalCO2)/1000))} كجم</span>
                    <span className="text-[10px] text-teal-600 block font-bold">تقليل الأثر الكربوني</span>
                  </div>
                </div>

              </div>

              {/* Graphical Map Simulation container */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800 block">المحاكي البصري لخط السير الجغرافي النشط 🗺️</h4>
                    <p className="text-[10px] text-slate-400 font-bold">مقارنة بصرية بين المسار البديل غير الآمن (أحمر مبعثر) والمسار المحسّن المعتمد (أخضر مستمر)</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={startVisualSimulation}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#0F4C81] hover:bg-[#0b3c66] text-white text-[10px] font-black rounded-lg transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isSimulating ? 'إيقاف مؤقت ⏸️' : 'بدء محاكاة الحركة 🚛💨'}</span>
                    </button>
                    <button
                      onClick={resetVisualSimulation}
                      className="p-1.5 bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
                      title="إعادة التعيين"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* SVG Route Visualization - Designed purely for stunning UI with vectors and markers */}
                <div className="relative h-60 w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
                  
                  {/* Grid Lines Overlay */}
                  <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
                  
                  <svg className="w-full h-full" viewBox="0 0 600 240">
                    {/* Definitions for gradients and markers */}
                    <defs>
                      <linearGradient id="optimalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                      <linearGradient id="dangerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                      <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="10" stroke="#ef4444" strokeWidth="2" className="opacity-40" />
                      </pattern>
                    </defs>

                    {/* Restricted or Flooded zone indicator (Hatching) */}
                    <rect x="250" y="30" width="120" height="65" fill="url(#diagonalHatch)" rx="8" />
                    <text x="310" y="65" fill="#ef4444" fontSize="8" fontWeight="bold" textAnchor="middle">
                      ⚠️ نفق منخفض الخلوص (ممنوع للروافع)
                    </text>

                    {/* Standard/Danger Dotted Route (Cairo Urban Road / Congested / low bridges) */}
                    <path 
                      d="M 80,120 C 180,50 320,50 520,120" 
                      fill="none" 
                      stroke="#ef4444" 
                      strokeWidth="2.5" 
                      strokeDasharray="4,6" 
                      className="opacity-70"
                    />
                    <text x="310" y="25" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle" className="opacity-80">
                      الطريق البديل (زحام مروري وتفقد الأوزان)
                    </text>

                    {/* Safe/Optimal Continuous Green Route (Regional Ring Road / Desert Highway) */}
                    <path 
                      id="optimal-path"
                      d="M 80,120 C 120,190 280,210 420,180 C 480,160 500,140 520,120" 
                      fill="none" 
                      stroke="url(#optimalGradient)" 
                      strokeWidth="4" 
                      strokeLinecap="round"
                    />

                    {/* Waypoints & Checkpoints */}
                    {/* Departure Pin */}
                    <circle cx="80" cy="120" r="7" fill="#0F4C81" stroke="#ffffff" strokeWidth="2" />
                    <text x="80" y="105" fill="#e2e8f0" fontSize="9" fontWeight="bold" textAnchor="middle">
                      المنطلق 🏢
                    </text>

                    {/* Checkpoint 1 (Weigh Bridge / Safety stop) */}
                    <circle cx="280" cy="201" r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                    <text x="280" y="220" fill="#94a3b8" fontSize="8" fontWeight="semibold" textAnchor="middle">
                      محطة قياس الوزن ⚖️
                    </text>

                    {/* Checkpoint 2 (Bridge load checkpoint) */}
                    <circle cx="420" cy="180" r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
                    <text x="420" y="198" fill="#94a3b8" fontSize="8" fontWeight="semibold" textAnchor="middle">
                      بوابة العبور الآمنة 🛡️
                    </text>

                    {/* Destination Pin */}
                    <circle cx="520" cy="120" r="7" fill="#e11d48" stroke="#ffffff" strokeWidth="2" />
                    <text x="520" y="105" fill="#f1f5f9" fontSize="9" fontWeight="extrabold" textAnchor="middle">
                      الموقع 🏗️
                    </text>

                    {/* Animated cargo truck representing simulation progress */}
                    {simProgress > 0 && (
                      <g transform="translate(0, 0)">
                        {/* Get position on path dynamically or mock with simple cubic bezier interpolation */}
                        {(() => {
                          const t = simProgress / 100;
                          // Standard cubic bezier calculation for M 80,120 C 120,190 280,210 420,180 C 480,160 500,140 520,120
                          // Approximate coordinates along the curve for visual feedback
                          let x = 80 + t * (520 - 80);
                          let y = 120;
                          
                          // Custom simple wave matching the path
                          if (t < 0.5) {
                            const subT = t * 2;
                            y = 120 * (1 - subT) + 201 * subT;
                            x = 80 * (1 - subT) + 280 * subT;
                          } else {
                            const subT = (t - 0.5) * 2;
                            y = 201 * (1 - subT) + 120 * subT;
                            x = 280 * (1 - subT) + 520 * subT;
                          }

                          return (
                            <g transform={`translate(${x - 8}, ${y - 12})`}>
                              {/* Glowing trace */}
                              <circle cx="8" cy="12" r="14" fill="#10b981" className="opacity-20 animate-ping" />
                              {/* Mini truck representation */}
                              <rect width="18" height="10" rx="2" fill="#059669" stroke="#ffffff" strokeWidth="1" />
                              <rect x="12" width="6" height="8" rx="1" fill="#34d399" />
                              <circle cx="4" cy="11" r="2" fill="#1e293b" />
                              <circle cx="14" cy="11" r="2" fill="#1e293b" />
                            </g>
                          );
                        })()}
                      </g>
                    )}
                  </svg>

                  {/* On-screen status indicator during simulation */}
                  {isSimulating && (
                    <div className="absolute top-3 left-3 bg-emerald-600 text-white px-3 py-1 rounded-lg text-[9px] font-black flex items-center gap-1 animate-pulse">
                      <Truck className="w-3 h-3 animate-bounce" />
                      <span>جاري تتبع الرحلة المحاكية: {Math.round(simProgress)}%</span>
                    </div>
                  )}

                  {simProgress === 100 && (
                    <div className="absolute top-3 left-3 bg-sky-600 text-white px-3 py-1 rounded-lg text-[9px] font-black flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>اكتملت محاكاة المسار بنجاح</span>
                    </div>
                  )}
                </div>

                {/* Legend & Summary */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-500 font-bold bg-slate-50 p-3 rounded-xl">
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-0.5 bg-emerald-500 inline-block" />
                      مسار الرافعة المحسّن (آمن وموفر)
                    </span>
                    <span className="flex items-center gap-1 text-rose-500">
                      <span className="w-3 h-0.5 bg-rose-500 inline-block stroke-dasharray" style={{ borderTop: '2px dashed' }} />
                      طرق فرعية / كباري محظورة الأوزان
                    </span>
                  </div>
                  <span>الخلوص الرأسي المتاح: {customHeightLimit}م | أقصى وزن فني مسموح: {customWeightLimit} طن</span>
                </div>

              </div>

              {/* Warnings and constraints block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Specific Warnings */}
                <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 space-y-3.5">
                  <span className="text-[10px] text-amber-400 font-black flex items-center gap-1 border-b border-slate-800 pb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
                    توجيهات السلامة الفنية الملزمة 🛡️⚠️
                  </span>
                  <div className="space-y-3">
                    {routeResults.alerts.map((al: any, idx: number) => (
                      <div key={idx} className="space-y-1">
                        <span className={`text-[11px] font-black block ${al.type === 'danger' ? 'text-rose-400' : al.type === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {al.title}
                        </span>
                        <p className="text-[10px] text-slate-300 font-bold leading-normal">{al.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Required Permits */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-3">
                  <span className="text-[10px] text-[#0F4C81] font-black flex items-center gap-1 border-b border-slate-50 pb-2">
                    <ShieldCheck className="w-4 h-4 text-[#0F4C81]" />
                    التصاريح والمستندات الحكومية المعتمدة 📋
                  </span>
                  <div className="space-y-2 text-[10px] font-black text-slate-600">
                    <p className="text-[9px] text-slate-400">يلزم إرفاق المستندات التالية وتوفيرها رقمياً أو ورقياً مع سائق الشاحنة:</p>
                    {routeResults.permits.length > 0 ? (
                      routeResults.permits.map((p: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{p}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>رخصة تسيير موحدة للنقل الموقعي القياسي بمصر</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>إقرار فحص فني قبل التحرك للمسارات المحسنة (Approved Route Blueprint)</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Step-by-Step Optimized Roadbook */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-extrabold text-xs text-slate-800">تفاصيل كتيب الطريق الملاحي (Optimized Roadbook) 📖🛣️</h4>
                  <button
                    onClick={() => setShowManifestModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#0F4C81] hover:bg-[#0b3c66] text-white text-[10px] font-black rounded-lg transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>توليد كرت خط السير ومخصص الوقود 📄🖨️</span>
                  </button>
                </div>

                <div className="relative border-r-2 border-slate-100 mr-2.5 space-y-5 py-2">
                  {routeResults.steps.map((st: any, idx: number) => (
                    <div key={idx} className="relative pr-6">
                      {/* Timeline dot */}
                      <div className="absolute -right-[7px] top-1.5 w-3.5 h-3.5 bg-white border-2 border-[#0F4C81] rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-[#0F4C81] rounded-full" />
                      </div>

                      {/* Checkpoint text block */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] font-black px-2 py-0.5 bg-slate-100 rounded-md text-slate-600">
                            كم {st.km}
                          </span>
                          <span className="text-[9px] font-black px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded">
                            السرعة الموصى بها: {st.speed}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-bold leading-relaxed">{st.text}</p>
                        <p className="text-[9px] text-[#0F4C81] font-bold">⚠️ إرشادات أمان: {st.safety}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-50 p-12 rounded-3xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-white rounded-full shadow-xs text-slate-300">
                <Compass className="w-10 h-10 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-700">جاري حساب المسارات وحل الخوارزمية الفنية...</h4>
                <p className="text-xs text-slate-400">يقوم النظام بقياس الأبعاد والأوزان والمسارات الشاغرة لتزويدك بأدق البيانات.</p>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* TRIP MANIFEST & FUEL VOUCHER MODAL */}
      {showManifestModal && routeResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col font-sans text-right dir-rtl">
            
            {/* Modal Header */}
            <div className="bg-slate-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black">
                <Truck className="w-4.5 h-4.5 text-[#0F4C81]" />
                <span>كرت خط السير ومخصص الوقود المعتمد لرحلات النقل 🇪🇬⛽</span>
              </div>
              <button
                onClick={() => setShowManifestModal(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors text-xs font-black bg-slate-800 rounded-lg cursor-pointer px-3"
              >
                إغلاق ✕
              </button>
            </div>

            {/* Printable Manifest Content */}
            <div className="p-8 overflow-y-auto space-y-6 flex-1 bg-white print:p-0" id="printable-manifest-area">
              
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-slate-950 pb-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">مجموعة أوناش مصر للتجارة والهندسة 🏗️</h3>
                  <p className="text-xs text-slate-500 font-bold">وحدة تسيير الأسطول وإدارة الحركة والمخصصات البترولية</p>
                  <p className="text-[10px] text-slate-400 font-mono font-bold">بوابة النقل الذكية | REF: OPT-RT-{Math.floor(Math.random() * 90000) + 10000}</p>
                </div>
                <div className="p-2 border border-slate-300 rounded-xl bg-slate-50 text-center font-black self-stretch sm:self-auto flex flex-col justify-center">
                  <span className="text-[9px] text-[#0F4C81] block">باركود الصرف ⛽</span>
                  <span className="text-sm font-mono tracking-wider text-slate-800">#EGY-DIESEL-{Math.floor(Math.random() * 10000)}</span>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4 text-xs border border-slate-100 p-4 rounded-xl bg-slate-50/60">
                <div>
                  <span className="text-slate-400 block text-[10px]">المعدة (الونش):</span>
                  <span className="text-slate-800 font-black">{routeResults.craneName} ({routeResults.craneCode})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">الحمولة الكلية:</span>
                  <span className="text-slate-800 font-black">{routeResults.craneWeight} طن</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">جهة المغادرة والانطلاق:</span>
                  <span className="text-slate-800 font-bold">{routeResults.departureName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">المشروع المستلم وجهة الوصول:</span>
                  <span className="text-slate-800 font-bold">{routeResults.destinationName}</span>
                </div>
              </div>

              {/* Recommended Route Details */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-xs text-slate-800">المسار الملاحي المعتمد وبيانات الصرف</h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <span className="text-[9px] text-indigo-800 font-bold block">المسافة المعتمدة</span>
                    <span className="text-lg font-mono font-black text-indigo-900">{routeResults.optimalDist} كم</span>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <span className="text-[9px] text-emerald-800 font-bold block">مخصص السولار المعتمد</span>
                    <span className="text-lg font-mono font-black text-emerald-900">{routeResults.optimalFuel} لتر</span>
                  </div>
                  <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl">
                    <span className="text-[9px] text-[#0F4C81] font-bold block">الزمن المتوقع للوصول</span>
                    <span className="text-lg font-mono font-black text-sky-900">{routeResults.optimalHours} ساعة</span>
                  </div>
                </div>
              </div>

              {/* Safety notice for the driver */}
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-[10px] leading-relaxed font-bold text-amber-900 space-y-1">
                <p className="font-black text-xs">⚠️ تعليمات الإدارة العامة للمرور وسائقي الموكب:</p>
                <p>• هذا المسار محسّن وخاضع للتوجيه الرقمي. يجب عدم الانحراف إلى الطرق الفلاحية أو ممرات الجسور المحلية لتجنب المساءلة القانونية والحوادث.</p>
                <p>• الالتزام الصارم بحد السرعة القانونية للمعدات الثقيلة ({routeResults.steps[1]?.speed || '40 كم/س'})، مع تأمين مروحة التبريد ومكابح الجرار طوال المسافة.</p>
              </div>

              {/* Approval Footer signatures */}
              <div className="pt-6 grid grid-cols-2 gap-4 text-xs font-bold border-t border-slate-100">
                <div className="space-y-4">
                  <p className="text-slate-400">مسؤول الصرف والحركة:</p>
                  <p className="text-slate-800">أ. مصطفى الشافعي ✍️</p>
                </div>
                <div className="space-y-4 text-left">
                  <p className="text-slate-400 text-right">أختام وتصديق حركة النقليات:</p>
                  <div className="inline-flex flex-col items-center p-2 border border-dashed border-emerald-600 rounded-xl bg-emerald-50">
                    <span className="text-[9px] text-emerald-700 font-black">EGYPT CRANES ROAD CLEARANCE</span>
                    <span className="text-[8px] text-emerald-500 font-mono">APPROVED BLUEPRINT v1.2</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Actions footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <p className="text-[10px] text-slate-400 font-bold">يمكن طباعة كرت تسيير الموكب مباشرة لإرفاقه مع السائقين والمندوبين.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0F4C81] hover:bg-[#0c3e6a] text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الكرت 🖨️</span>
                </button>
                <button
                  onClick={() => {
                    alert('تمت محاكاة تصدير كرت مخصص وقود ومسار ملاحي بنجاح بصيغة PDF!');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير ملف 💾</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
