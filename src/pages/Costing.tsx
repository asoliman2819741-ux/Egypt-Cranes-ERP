import React, { useState } from 'react';
import { CostCenter, Crane } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { DollarSign, ShieldAlert, TrendingUp, Zap, HelpCircle, Fuel, Sparkles, Navigation, Leaf, Award } from 'lucide-react';

interface CostingProps {
  costCenters: CostCenter[];
  cranes: Crane[];
}

export default function Costing({ costCenters, cranes }: CostingProps) {
  const [selectedCCId, setSelectedCCId] = useState<string>(costCenters[0]?.id || '');
  
  // Fuel Cost Simulator interactive state variables
  const [fleetDistance, setFleetDistance] = useState<number>(18500); // Monthly fleet distance in KM
  const [fuelPrice, setFuelPrice] = useState<number>(14.0); // Fuel price in EGP/Liter
  const [averageConsumption, setAverageConsumption] = useState<number>(45); // Liters per 100 KM
  const [routeOptimizationPct, setRouteOptimizationPct] = useState<number>(18); // Route optimization %

  const currentCC = costCenters.find(c => c.id === selectedCCId) || costCenters[0];

  // Mock breakdown of costs for selected CC
  const costBreakdown = [
    { name: 'الوقود والديزل', value: Math.round(currentCC.usedBudget * 0.35), icon: 'soler', desc: 'استهلاك السولار والزيوت الموقعية للأوناش' },
    { name: 'أجور المشغلين والمساعدين', value: Math.round(currentCC.usedBudget * 0.25), icon: 'operators', desc: 'الرواتب والحوافز الإضافية وبدل الانتقال للمواقع' },
    { name: 'قطع غيار وصيانة طارئة', value: Math.round(currentCC.usedBudget * 0.20), icon: 'maint', desc: 'الفلاتر الهيدروليكية، حبال الرفع، والشحوم المصروفة' },
    { name: 'إهلاك الأوناش التناقصي', value: Math.round(currentCC.usedBudget * 0.15), icon: 'depr', desc: 'الإهلاك المالي الدوري للرافعات لتحديد صافي الأرباح' },
    { name: 'مصاريف إدارية وتأمين خارجي', value: Math.round(currentCC.usedBudget * 0.05), icon: 'admin', desc: 'التأمين ضد الحوادث، رسوم ترخيص الهيئات، والنقل والتعبئة' },
  ];

  // Compare budget vs actual for chart
  const budgetVsActualData = costCenters.map(cc => ({
    name: cc.code,
    fullName: cc.nameAr,
    'الموازنة المعتمدة': cc.budget,
    'التكاليف الفعلية': cc.usedBudget,
  }));

  const totalBudget = costCenters.reduce((sum, c) => sum + c.budget, 0);
  const totalActual = costCenters.reduce((sum, c) => sum + c.usedBudget, 0);
  const totalProfitPct = totalBudget > 0 ? ((totalBudget - totalActual) / totalBudget) * 100 : 0;

  return (
    <div className="p-6 space-y-6 dir-rtl text-right font-sans">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">تكاليف التشغيل وتحليل الربحية (Cost Control)</h1>
        <p className="text-slate-500 mt-1 text-sm">توزيع وتحليل تكاليف تشغيل أسطول الرافعات (المحروقات، الصيانة، الأجور، والإهلاك)</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">إجمالي الموازنة المخططة</span>
            <p className="text-xl font-black text-[#0F4C81]">{totalBudget.toLocaleString()} ج.م</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0F4C81] flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">التكاليف التشغيلية الفعلية</span>
            <p className="text-xl font-black text-rose-600">{totalActual.toLocaleString()} ج.م</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">صافي هامش الأمان للموازنات</span>
            <p className="text-xl font-black text-emerald-600">
              {(totalBudget - totalActual).toLocaleString()} ج.م (+{totalProfitPct.toFixed(1)}%)
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base">مقارنة الموازنة المعتمدة بالمنصرف الفعلي لكل مركز تكلفة</h3>
          <p className="text-xs text-slate-400">تحليل فوري للانحراف المالي لجميع مشاريع الأوناش بالجمهورية</p>
        </div>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={budgetVsActualData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
              <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString()} ج.م`]} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar name="الموازنة المعتمدة" dataKey="الموازنة المعتمدة" fill="#0F4C81" radius={[4, 4, 0, 0]} />
              <Bar name="التكاليف الفعلية" dataKey="التكاليف الفعلية" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost Center Drill-down and Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Selector & Detailed Cost Breakdown Cards */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">دراسة بنود التكاليف التفصيلية</h3>
              <p className="text-xs text-slate-400">اختر المشروع لعرض الهيكل التشغيلي للمصاريف</p>
            </div>
            
            <select
              value={selectedCCId}
              onChange={(e) => setSelectedCCId(e.target.value)}
              className="p-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#0F4C81]"
            >
              {costCenters.map(cc => (
                <option key={cc.id} value={cc.id}>{cc.nameAr} ({cc.code})</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {costBreakdown.map((cost, idx) => {
              const pctOfUsed = currentCC.usedBudget > 0 ? (cost.value / currentCC.usedBudget) * 100 : 0;
              return (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">{cost.name}</span>
                      <span className="text-[10px] text-slate-400">{cost.desc}</span>
                    </div>
                    <div className="text-left font-mono">
                      <span className="font-bold text-slate-800 block">{cost.value.toLocaleString()} ج.م</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{pctOfUsed.toFixed(1)}% من المصروف</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className="bg-[#0F4C81] h-1.5 rounded-full" style={{ width: `${pctOfUsed}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operating cost per Crane metrics */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">معدلات التشغيل لكل طن حمولة باليوم</h3>
            <p className="text-xs text-slate-400">تكلفة الصيانة والتشغيل المعيارية المقدرة للأوناش</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px]">
            {cranes.map(crane => {
              // Standard cost estimate calculations
              const estimatedDailyCost = crane.capacity * 250 + 1200; // rough standard formula
              const estimatedHourlyCost = estimatedDailyCost / 8;
              return (
                <div key={crane.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{crane.nameAr}</span>
                    <span className="text-[10px] text-slate-400">حمولة: {crane.capacity} طن • كود: {crane.code}</span>
                  </div>
                  <div className="text-left font-mono">
                    <span className="font-bold text-[#0F4C81] block">{estimatedDailyCost.toLocaleString()} ج.م / يوم</span>
                    <span className="text-[10px] text-slate-400 font-semibold">({Math.round(estimatedHourlyCost).toLocaleString()} ج.م / ساعة)</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 flex gap-2 items-start">
            <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
            <span>يتم حساب التكلفة اليومية المعيارية تلقائيًا بموجب استهلاك السولار بالموقع وقيمة إهلاك المعدة السنوي.</span>
          </div>
        </div>

      </div>

      {/* 3. Fuel Cost Simulator & Smart Route Savings Unit */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="font-extrabold text-base md:text-lg text-slate-800 flex items-center gap-2">
              <span className="p-1.5 bg-rose-50 text-rose-600 rounded-xl">
                <Fuel className="w-5 h-5 text-rose-600 animate-pulse" />
              </span>
              <span>محاكي تكاليف وقود الأسطول والوفر التشغيلي الذكي ⛽🔮</span>
            </h2>
            <p className="text-xs text-slate-400 font-bold">
              أداة تفاعلية متطورة لحساب معدلات الهدر والوفر المالي المباشر في السولار بعد تشغيل خوارزميات تحسين المسارات الذكية
            </p>
          </div>
          <span className="bg-rose-100 text-rose-800 text-[10px] px-2.5 py-1 rounded-full font-black self-start md:self-auto">
            مُحسّن المسارات نشط ⚡
          </span>
        </div>

        {/* Simulator Core State & Computations */}
        {(() => {
          // Inner calculations for clean rendering
          const currentMonthlyFuel = (fleetDistance * averageConsumption) / 100;
          const currentCost = currentMonthlyFuel * fuelPrice;
          
          const savedFuel = currentMonthlyFuel * (routeOptimizationPct / 100);
          const savedCost = currentCost * (routeOptimizationPct / 100);
          const optimizedCost = currentCost - savedCost;
          const annualSavings = savedCost * 12;
          const co2SavedTons = (savedFuel * 2.68) / 1000;

          // Chart data calculations
          const chartProgression = [0, 5, 10, 15, 20, 25, 30].map(pct => {
            const tempSaved = currentCost * (pct / 100);
            return {
              name: `تحسين ${pct}%`,
              'التكلفة المتبقية': Math.round(currentCost - tempSaved),
              'الوفر المالي': Math.round(tempSaved),
            };
          });

          // Per crane savings list
          const simulatedCranes = cranes.map(crane => {
            const craneShare = 1 / cranes.length;
            const distanceShare = fleetDistance * craneShare;
            
            let craneConsumption = 35; // Default L/100km
            if (crane.capacity >= 500) craneConsumption = 75;
            else if (crane.capacity >= 300) craneConsumption = 60;
            else if (crane.capacity >= 200) craneConsumption = 48;
            else if (crane.capacity >= 120) craneConsumption = 38;

            const craneFuel = (distanceShare * craneConsumption) / 100;
            const craneCurrentCost = craneFuel * fuelPrice;
            const craneSavedCost = craneCurrentCost * (routeOptimizationPct / 100);
            const craneSavedFuel = craneFuel * (routeOptimizationPct / 100);

            return {
              ...crane,
              consumption: craneConsumption,
              distance: Math.round(distanceShare),
              currentCost: Math.round(craneCurrentCost),
              savedCost: Math.round(craneSavedCost),
              savedFuel: Math.round(craneSavedFuel),
            };
          });

          return (
            <div className="space-y-6">
              
              {/* Grid layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Simulator Inputs (5 columns) */}
                <div className="lg:col-span-5 space-y-5 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-xs">
                    <Navigation className="w-4 h-4 text-rose-500" />
                    <span>تعديل معايير ومقاييس المحاكاة الحالية</span>
                  </div>

                  {/* Input 1: Monthly Fleet Distance */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-600">إجمالي المسافات المقطوعة شهرياً (الأسطول):</span>
                      <span className="font-mono text-rose-600">{fleetDistance.toLocaleString()} كم</span>
                    </div>
                    <input 
                      type="range" 
                      min="5000" 
                      max="50000" 
                      step="500"
                      value={fleetDistance} 
                      onChange={(e) => setFleetDistance(Number(e.target.value))}
                      className="w-full accent-rose-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-black text-slate-400">
                      <span>٥,٠٠٠ كم</span>
                      <span>وردية متوسطة</span>
                      <span>٥٠,٠٠٠ كم (عمل شاق)</span>
                    </div>
                  </div>

                  {/* Input 2: Average Fuel Consumption */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-600">متوسط استهلاك الوقود العام للونش:</span>
                      <span className="font-mono text-rose-600">{averageConsumption} لتر / ١٠٠ كم</span>
                    </div>
                    <input 
                      type="range" 
                      min="20" 
                      max="80" 
                      step="1"
                      value={averageConsumption} 
                      onChange={(e) => setAverageConsumption(Number(e.target.value))}
                      className="w-full accent-rose-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-black text-slate-400">
                      <span>٢٠ لتر (خفيف)</span>
                      <span>متوسط أوناش الجنزير (٤٥)</span>
                      <span>٨٠ لتر (فائق الثقل)</span>
                    </div>
                  </div>

                  {/* Input 3: Diesel price */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-600">سعر لتر السولار / الوقود المعياري:</span>
                      <span className="font-mono text-rose-600">{fuelPrice} ج.م / لتر</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="25" 
                      step="0.5"
                      value={fuelPrice} 
                      onChange={(e) => setFuelPrice(Number(e.target.value))}
                      className="w-full accent-rose-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-black text-slate-400">
                      <span>١٠ ج.م</span>
                      <span>السعر الرسمي الحالي</span>
                      <span>٢٥ ج.م</span>
                    </div>
                  </div>

                  {/* Input 4: Optimization percentage */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-600">نسبة تحسين خوارزمية المسارات (AI):</span>
                      <span className="font-mono text-emerald-600">+{routeOptimizationPct}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="35" 
                      step="1"
                      value={routeOptimizationPct} 
                      onChange={(e) => setRouteOptimizationPct(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-black text-slate-400">
                      <span>%٥ (أساسي)</span>
                      <span>معدل ذكي معتاد (%١٥)</span>
                      <span>%٣٥ (تحسين فائق ومسارات مثلى)</span>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 block uppercase">مستويات كفاءة نظام الخوارزميات (مسبقة الصنع):</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRouteOptimizationPct(8)}
                        className={`py-1.5 px-1 text-[10px] font-black rounded-xl border transition-all cursor-pointer ${
                          routeOptimizationPct === 8
                            ? 'bg-[#0F4C81] text-white border-[#0F4C81]'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        مسارات ثنائية (٨%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRouteOptimizationPct(18)}
                        className={`py-1.5 px-1 text-[10px] font-black rounded-xl border transition-all cursor-pointer ${
                          routeOptimizationPct === 18
                            ? 'bg-[#0F4C81] text-white border-[#0F4C81]'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        ذكاء موقعي (١٨%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRouteOptimizationPct(28)}
                        className={`py-1.5 px-1 text-[10px] font-black rounded-xl border transition-all cursor-pointer ${
                          routeOptimizationPct === 28
                            ? 'bg-[#0F4C81] text-white border-[#0F4C81]'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        محاكاة قصوى (٢٨%)
                      </button>
                    </div>
                  </div>

                </div>

                {/* Simulation Output Dashboard & Charts (7 columns) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Results Indicators Cards (3-column layout) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {/* KPI 1: Monthly Cost Saved */}
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] text-emerald-800 font-extrabold">الوفر المالي الشهري</span>
                        <span className="p-1 bg-emerald-100 text-emerald-700 rounded-lg">
                          <DollarSign className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <div className="mt-2.5">
                        <h4 className="text-base font-black text-emerald-900 font-mono">
                          {Math.round(savedCost).toLocaleString()} ج.م
                        </h4>
                        <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">
                          توفير {Math.round(savedFuel).toLocaleString()} لتر ديزل
                        </span>
                      </div>
                    </div>

                    {/* KPI 2: Annual Cost Saved */}
                    <div className="bg-[#0F4C81]/5 border border-[#0F4C81]/10 p-4 rounded-2xl flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] text-[#0F4C81] font-extrabold">الوفر المالي السنوي</span>
                        <span className="p-1 bg-[#0F4C81]/10 text-[#0F4C81] rounded-lg">
                          <Award className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <div className="mt-2.5">
                        <h4 className="text-base font-black text-[#0F4C81] font-mono">
                          {Math.round(annualSavings).toLocaleString()} ج.م
                        </h4>
                        <span className="text-[9px] text-slate-500 font-bold block mt-0.5">
                          موازنة وقود معفاة بالكامل 💰
                        </span>
                      </div>
                    </div>

                    {/* KPI 3: Carbon Footprint Savings */}
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] text-rose-800 font-extrabold">تخفيض البصمة الكربونية</span>
                        <span className="p-1 bg-rose-100 text-rose-700 rounded-lg">
                          <Leaf className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <div className="mt-2.5">
                        <h4 className="text-base font-black text-rose-900 font-mono">
                          {co2SavedTons.toFixed(2)} طن CO2
                        </h4>
                        <span className="text-[9px] text-rose-600 font-bold block mt-0.5">
                          انبعاثات دافئة متجنبة شهرياً 🌿
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Savings progression chart */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800 block">انحناء تكلفة الوقود مقابل زيادة كفاءة المسارات</span>
                      <span className="text-[9px] text-slate-400 font-bold">بناءً على السعر الحالي {fuelPrice} ج.م/لتر</span>
                    </div>

                    <div className="h-[180px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartProgression} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRemaining" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#EF4444" stopOpacity={0.01}/>
                            </linearGradient>
                            <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0.01}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} />
                          <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} />
                          <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString()} ج.م`]} />
                          <Area name="التكلفة المتبقية" type="monotone" dataKey="التكلفة المتبقية" stroke="#EF4444" fillOpacity={1} fill="url(#colorRemaining)" />
                          <Area name="الوفر المالي" type="monotone" dataKey="الوفر المالي" stroke="#10B981" fillOpacity={1} fill="url(#colorSavings)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="text-[10px] text-slate-500 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 flex gap-2 items-center">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>
                        تقليص المسافات ومطابقة حركة الأوناش يقلل التكلفة الإجمالية من <strong className="font-mono text-slate-800">{Math.round(currentCost).toLocaleString()} ج.م</strong> إلى <strong className="font-mono text-emerald-600">{Math.round(optimizedCost).toLocaleString()} ج.م</strong>، بنسبة ربح مباشر تعيد توجيه مخصصات الديزل للصيانة الهيكلية.
                      </span>
                    </div>

                  </div>

                </div>

              </div>

              {/* Per Crane Simulated Breakdown Section */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm">التوفير المالي التفصيلي لكل ونش في الأسطول شهرياً</h4>
                  <span className="text-[10px] text-slate-400 font-bold">موزعة بالتساوي ومقاسة بمستوى استهلاك المحرك ومعدلات الحمل</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {simulatedCranes.map(crane => (
                    <div key={`crane-sim-card-${crane.id}`} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 space-y-3 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="font-mono font-black text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-md">
                            {crane.code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {crane.capacity} طن
                          </span>
                        </div>
                        <h5 className="font-black text-slate-800 text-[11px] line-clamp-1">{crane.nameAr}</h5>
                      </div>

                      <div className="space-y-1.5 text-[10px] text-slate-500 font-bold bg-white p-2.5 rounded-xl border border-slate-100">
                        <div className="flex justify-between">
                          <span>مسافة شهرية:</span>
                          <span className="font-mono text-slate-700">{crane.distance} كم</span>
                        </div>
                        <div className="flex justify-between">
                          <span>استهلاك تقريبي:</span>
                          <span className="font-mono text-slate-700">{crane.consumption} لتر/١٠٠كم</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1.5 text-emerald-600">
                          <span>وقود موفر:</span>
                          <span className="font-mono font-extrabold">~ {crane.savedFuel} لتر</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-1.5 rounded-xl text-[10px] font-extrabold font-mono">
                        <span>وفر مالي:</span>
                        <span>+{crane.savedCost.toLocaleString()} ج.م</span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>
          );
        })()}

      </div>

    </div>
  );
}
