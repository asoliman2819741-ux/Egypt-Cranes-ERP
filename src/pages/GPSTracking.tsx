import React, { useState } from 'react';
import { Crane } from '../types';
import { MapPin, Navigation, Gauge, Fuel, Search, Compass, Info } from 'lucide-react';

interface GPSTrackingProps {
  cranes: Crane[];
}

export default function GPSTracking({ cranes }: GPSTrackingProps) {
  const [search, setSearch] = useState('');
  const [selectedCraneId, setSelectedCraneId] = useState<string | null>(cranes[0]?.id || null);

  const filtered = cranes.filter(c => 
    c.nameAr.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.operatorName.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCrane = cranes.find(c => c.id === selectedCraneId);

  // Map limits for visual simulation inside standard container
  // Egypt Lat range approx: 22 to 31.5, Lng: 25 to 35
  // We can convert Lat/Lng to visual percentage coordinates inside our gorgeous dashboard layout map!
  const getMapCoords = (lat: number, lng: number) => {
    const latMin = 26.5;
    const latMax = 32.0;
    const lngMin = 28.5;
    const lngMax = 35.0;

    const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
    const y = 100 - ((lat - latMin) / (latMax - latMin)) * 100; // invert Y since lat increases upwards

    return { 
      x: Math.max(10, Math.min(x, 90)), 
      y: Math.max(10, Math.min(y, 90)) 
    };
  };

  return (
    <div className="p-6 space-y-6 dir-rtl text-right font-sans">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">نظام التتبع الجغرافي الحي (GPS Fleet Tracking)</h1>
        <p className="text-slate-500 mt-1 text-sm">مراقبة حية لمواقع أوناش ورافعات Egypt Cranes العملاقة عبر الأقمار الصناعية بالمحافظات</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Cranes List */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
          <div className="p-4 border-b border-slate-100 space-y-3">
            <h3 className="font-bold text-slate-800 text-sm">قائمة الأساطيل النشطة</h3>
            <div className="relative">
              <input 
                type="text" 
                placeholder="البحث بالرمز أو الكود الجغرافي..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
              />
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {filtered.map(crane => {
              const isActive = crane.id === selectedCraneId;
              return (
                <button
                  key={crane.id}
                  onClick={() => setSelectedCraneId(crane.id)}
                  className={`w-full p-4 flex items-start justify-between text-right transition-colors ${
                    isActive ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                        {crane.code}
                      </span>
                      <h4 className="font-bold text-slate-800 text-xs truncate">
                        {crane.nameAr}
                      </h4>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      المشغل: {crane.operatorName}
                    </div>
                    
                    {/* Tiny telemetry data */}
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                      <span className="flex items-center gap-0.5">
                        <Gauge className="w-3 h-3 text-slate-400" /> {crane.speed} كم/س
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Fuel className="w-3 h-3 text-slate-400" /> {crane.fuelLevel}%
                      </span>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    crane.status === 'running' ? 'bg-emerald-50 text-emerald-700' :
                    crane.status === 'idle' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                  }`}>
                    <span className={`w-1 h-1 rounded-full animate-pulse ${
                      crane.status === 'running' ? 'bg-emerald-500' :
                      crane.status === 'idle' ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                    {crane.status === 'running' ? 'يتحرك' :
                     crane.status === 'idle' ? 'جاهز' : 'صيانة'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Visual Simulated Live Map */}
        <div className="lg:col-span-8 bg-[#101524] rounded-2xl border border-slate-900 shadow-sm p-4 relative overflow-hidden h-[600px] flex flex-col justify-between">
          
          {/* Futuristic Map Overlay elements */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent z-0" />
          
          {/* Header Map indicators */}
          <div className="relative z-10 flex items-center justify-between bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-800 text-white">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#F7941D] animate-spin" style={{ animationDuration: '6s' }} />
              <div>
                <span className="text-xs font-bold block text-slate-100">رادار التتبع الحي لجمهورية مصر العربية</span>
                <span className="text-[10px] text-slate-400 font-light">القمر الصناعي: نايل سات • تغطية حية نشطة</span>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold animate-pulse">
              ● متصل بالشبكة المركزية
            </span>
          </div>

          {/* Map Area containing simulated nodes */}
          <div className="flex-1 relative w-full h-full z-10">
            {/* Outline of major Egyptian cities / grid markers */}
            <div className="absolute left-[70%] top-[40%] text-[10px] text-slate-500 font-mono select-none">
              القاهرة والدلتا
            </div>
            <div className="absolute left-[35%] top-[25%] text-[10px] text-slate-500 font-mono select-none">
              الإسكندرية والساحل
            </div>
            <div className="absolute left-[80%] top-[65%] text-[10px] text-slate-500 font-mono select-none">
              البحر الأحمر والغردقة
            </div>
            <div className="absolute left-[85%] top-[30%] text-[10px] text-slate-500 font-mono select-none">
              قناة السويس وبورسعيد
            </div>

            {/* Simulated route lines/arcs for visualization */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
              <path d="M 35 25 Q 52.5 32.5 70 40" fill="none" stroke="#F7941D" strokeWidth="1" strokeDasharray="4 4" />
              <path d="M 70 40 Q 77.5 35 85 30" fill="none" stroke="#0F4C81" strokeWidth="1.5" strokeDasharray="3 3" />
            </svg>

            {/* Cranes Markers */}
            {cranes.map(crane => {
              const { x, y } = getMapCoords(crane.lat, crane.lng);
              const isSelected = crane.id === selectedCraneId;

              return (
                <div 
                  key={crane.id}
                  className="absolute transition-all duration-700"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <button
                    onClick={() => setSelectedCraneId(crane.id)}
                    className="relative -translate-x-1/2 -translate-y-1/2 group"
                  >
                    {/* Blinking outer circle */}
                    <span className={`absolute -inset-2.5 rounded-full opacity-35 animate-ping ${
                      crane.status === 'running' ? 'bg-emerald-500' :
                      crane.status === 'idle' ? 'bg-amber-500' : 'bg-red-500'
                    }`} style={{ animationDuration: '3s' }} />

                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shadow-lg transition-transform ${
                      isSelected ? 'scale-125 ring-4 ring-[#F7941D]/30 border-[#F7941D] bg-slate-900' : 
                      crane.status === 'running' ? 'bg-emerald-600 border-white' :
                      crane.status === 'idle' ? 'bg-amber-600 border-white' : 'bg-red-600 border-white'
                    }`}>
                      <Navigation className={`w-3.5 h-3.5 text-white ${
                        crane.status === 'running' ? 'rotate-45' : 'rotate-0'
                      }`} />
                    </div>

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-8 right-1/2 translate-x-1/2 bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                      <span className="font-bold block">{crane.nameAr}</span>
                      <span className="text-slate-400 mt-0.5">{crane.operatorName} | {crane.speed} كم/س</span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer selected telemetry dashboard */}
          {selectedCrane && (
            <div className="relative z-10 bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-slate-800 text-white grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1 col-span-2">
                <span className="text-[10px] text-slate-400 font-medium">المعدة المختارة للتتبع</span>
                <p className="text-xs font-black text-[#F7941D]">{selectedCrane.nameAr}</p>
                <span className="text-[10px] text-slate-400 font-mono block pt-0.5">كود: {selectedCrane.code} • لوحات: {selectedCrane.plateNumber}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-medium">السرعة ومعدل الضغط</span>
                <p className="text-xs font-bold flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-slate-500" /> {selectedCrane.speed} كم / الساعة
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-medium">مستوى الوقود الحالي</span>
                <div className="flex items-center gap-2">
                  <Fuel className="w-3.5 h-3.5 text-slate-500" />
                  <div className="flex-1 max-w-[80px] bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full ${selectedCrane.fuelLevel < 20 ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${selectedCrane.fuelLevel}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold">{selectedCrane.fuelLevel}%</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
