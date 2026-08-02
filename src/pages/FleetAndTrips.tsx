import React, { useState } from 'react';
import { Crane, Vehicle, Driver, Trip } from '../types';
import { initialCranes, initialVehicles, initialDrivers, initialTrips } from '../mockData';
import { 
  Truck, ShieldAlert, Compass, Search, Plus, Calendar, 
  MapPin, Clock, ArrowRightLeft, User, BarChart2, CheckCircle 
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import RouteOptimizer from '../components/RouteOptimizer';
import CranePerformanceReports from '../components/CranePerformanceReports';

interface FleetAndTripsProps {
  cranes: Crane[];
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  onAddCrane: (crane: Crane) => void;
  onAddVehicle: (vehicle: Vehicle) => void;
  onAddDriver: (driver: Driver) => void;
  onAddTrip: (trip: Trip) => void;
}

export default function FleetAndTrips({
  cranes, vehicles, drivers, trips,
  onAddCrane, onAddVehicle, onAddDriver, onAddTrip
}: FleetAndTripsProps) {
  const [activeTab, setActiveTab] = useState<'cranes' | 'vehicles' | 'drivers' | 'trips' | 'analytics' | 'routeOptimization' | 'performanceReports'>('cranes');
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states - Crane
  const [craneCode, setCraneCode] = useState(`EC-CR-${String(Math.floor(Math.random() * 900) + 100)}`);
  const [craneName, setCraneName] = useState('');
  const [craneModel, setCraneModel] = useState('');
  const [craneCap, setCraneCap] = useState('');
  const [craneOp, setCraneOp] = useState('');
  const [cranePlates, setCranePlates] = useState('');

  // Form states - Vehicle
  const [vhCode, setVhCode] = useState(`EC-VH-${String(Math.floor(Math.random() * 90) + 10).padStart(2, '0')}`);
  const [vhType, setVhType] = useState('');
  const [vhPlates, setVhPlates] = useState('');
  const [vhDriver, setVhDriver] = useState('');

  // Form states - Driver
  const [drName, setDrName] = useState('');
  const [drPhone, setDrPhone] = useState('');
  const [drLicense, setDrLicense] = useState('');

  // Form states - Trip
  const [tripNo, setTripNo] = useState(`TR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`);
  const [tripCraneId, setTripCraneId] = useState('');
  const [tripDriverId, setTripDriverId] = useState('');
  const [tripVehicleId, setTripVehicleId] = useState('');
  const [tripFrom, setTripDeparture] = useState('بوابة الورشة الرئيسية بالجيزة');
  const [tripTo, setTripDestination] = useState('');

  const handleCreateCrane = (e: React.FormEvent) => {
    e.preventDefault();
    const newCrane: Crane = {
      id: Math.random().toString(),
      code: craneCode,
      nameAr: craneName,
      model: craneModel,
      capacity: parseFloat(craneCap) || 50,
      status: 'idle',
      operatorName: craneOp,
      plateNumber: cranePlates,
      lat: 30.0444,
      lng: 31.2357, // Cairo coordinates by default
      speed: 0,
      fuelLevel: 100
    };
    onAddCrane(newCrane);
    setShowAddForm(false);
    // Reset
    setCraneCode(`EC-CR-${String(Math.floor(Math.random() * 900) + 100)}`);
    setCraneName('');
    setCraneModel('');
    setCraneCap('');
    setCraneOp('');
    setCranePlates('');
  };

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const newVh: Vehicle = {
      id: Math.random().toString(),
      code: vhCode,
      type: vhType,
      plateNumber: vhPlates,
      driverName: vhDriver,
      status: 'active'
    };
    onAddVehicle(newVh);
    setShowAddForm(false);
    // Reset
    setVhCode(`EC-VH-${String(Math.floor(Math.random() * 90) + 10).padStart(2, '0')}`);
    setVhType('');
    setVhPlates('');
    setVhDriver('');
  };

  const handleCreateDriver = (e: React.FormEvent) => {
    e.preventDefault();
    const newDr: Driver = {
      id: Math.random().toString(),
      name: drName,
      phone: drPhone,
      licenseNumber: drLicense,
      status: 'active'
    };
    onAddDriver(newDr);
    setShowAddForm(false);
    setDrName('');
    setDrPhone('');
    setDrLicense('');
  };

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    const crane = cranes.find(c => c.id === tripCraneId);
    const driver = drivers.find(d => d.id === tripDriverId);
    const vehicle = vehicles.find(v => v.id === tripVehicleId);

    if (!crane || !driver || !vehicle) {
      alert('يرجى تحديد الونش والسائق والمقطورة/الجرار للرحلة');
      return;
    }

    const newTrip: Trip = {
      id: Math.random().toString(),
      tripNo,
      craneId: crane.id,
      craneName: crane.nameAr,
      driverId: driver.id,
      driverName: driver.name,
      vehicleId: vehicle.id,
      vehicleCode: `${vehicle.code} (${vehicle.type.split(' ').slice(0, 2).join(' ')})`,
      departureGate: tripFrom,
      destination: tripTo,
      departureTime: new Date().toLocaleString('ar-EG'),
      status: 'active'
    };

    onAddTrip(newTrip);
    setShowAddForm(false);
    // Reset
    setTripNo(`TR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`);
    setTripCraneId('');
    setTripDriverId('');
    setTripVehicleId('');
    setTripDestination('');
  };

  // Filter lists based on tab
  const filteredCranes = cranes.filter(c => 
    c.nameAr.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.operatorName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredVehicles = vehicles.filter(v => 
    v.type.toLowerCase().includes(search.toLowerCase()) ||
    v.code.toLowerCase().includes(search.toLowerCase()) ||
    v.driverName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.phone.includes(search)
  );

  const filteredTrips = trips.filter(t => 
    t.tripNo.toLowerCase().includes(search.toLowerCase()) ||
    t.craneName.toLowerCase().includes(search.toLowerCase()) ||
    t.driverName.toLowerCase().includes(search.toLowerCase()) ||
    t.destination.toLowerCase().includes(search.toLowerCase())
  );

  // Trip analytical data summary
  const analyticsData = [
    { name: 'العاصمة الإدارية', count: 12 },
    { name: 'ميناء الإسكندرية', count: 8 },
    { name: 'بورسعيد', count: 5 },
    { name: 'العين السخنة', count: 6 },
    { name: 'أسيوط الجديدة', count: 3 },
  ];

  return (
    <div className="p-6 space-y-6 dir-rtl text-right font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">أسطول الأوناش والنقليات (Fleet & Fleet Logistics)</h1>
          <p className="text-slate-500 mt-1 text-sm">تسجيل الأوناش والمركبات الثقيلة، وإرسال وإحصاء رحلات النقل الموقعي بالمحافظات</p>
        </div>
        {activeTab !== 'analytics' && activeTab !== 'routeOptimization' && activeTab !== 'performanceReports' && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2.5 bg-[#0F4C81] text-white font-bold text-sm rounded-xl hover:bg-[#0c3d67] transition-colors flex items-center gap-1.5 self-start cursor-pointer"
          >
            <Plus className="w-5 h-5" /> 
            {activeTab === 'cranes' ? 'تسجيل ونش جديد' :
             activeTab === 'vehicles' ? 'إضافة رأس جرار/مقطورة' :
             activeTab === 'drivers' ? 'إضافة سائق جديد' : 'جدولة رحلة نقل للأوناش'}
          </button>
        )}
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {[
          { id: 'cranes', label: 'تعريف الأوناش (Cranes Catalog)' },
          { id: 'vehicles', label: 'المركبات والمقطورات (Vehicles)' },
          { id: 'drivers', label: 'السائقين والمشغلين (Drivers)' },
          { id: 'trips', label: 'الرحلات وسجل النقل (Trips)' },
          { id: 'analytics', label: 'إحصائيات الرحلات (Trip Analytics)' },
          { id: 'performanceReports', label: 'تقارير أداء كفاءة الأوناش (Performance Reports) 📊' },
          { id: 'routeOptimization', label: 'تحسين المسارات الذكي (Route Optimization) 🗺️⚡' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setSearch(''); }}
            className={`px-5 py-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter panel */}
      {activeTab !== 'analytics' && activeTab !== 'routeOptimization' && activeTab !== 'performanceReports' && (
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="relative">
            <input 
              type="text" 
              placeholder={`البحث في سجل ${
                activeTab === 'cranes' ? 'الأوناش ببيانات السعة أو الاسم...' :
                activeTab === 'vehicles' ? 'المركبات بنوع الجرار أو الكود...' :
                activeTab === 'drivers' ? 'السائقين بالاسم أو رقم الهاتف...' : 'الرحلات برقم الرحلة أو جهة الوصول...'
              }`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-11 pl-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          </div>
        </div>
      )}

      {/* TAB CONTENT: Cranes */}
      {activeTab === 'cranes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCranes.map(crane => (
            <div key={crane.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                    كود: {crane.code}
                  </span>
                  <h3 className="font-extrabold text-slate-800 text-sm block leading-snug pt-1">
                    {crane.nameAr}
                  </h3>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                  crane.status === 'running' ? 'bg-emerald-50 text-emerald-700 animate-pulse' :
                  crane.status === 'idle' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                }`}>
                  {crane.status === 'running' ? 'قيد العمل بالموقع' :
                   crane.status === 'idle' ? 'جاهز بالساحة' : 'بالصيانة'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-semibold pt-2 border-t border-slate-50">
                <div className="bg-slate-50 p-2.5 rounded-lg space-y-0.5">
                  <span className="text-slate-400 block font-normal">الموديل الفني:</span>
                  <span className="text-slate-800">{crane.model}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg space-y-0.5">
                  <span className="text-slate-400 block font-normal">سعة الرفع الثقيل:</span>
                  <span className="text-slate-800 font-extrabold">{crane.capacity} طن (Metric Ton)</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg space-y-0.5">
                  <span className="text-slate-400 block font-normal">مشغل المعدة (Operator):</span>
                  <span className="text-slate-800">{crane.operatorName}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg space-y-0.5">
                  <span className="text-slate-400 block font-normal">رقم اللوحة المرورية:</span>
                  <span className="text-slate-800 font-mono font-bold">{crane.plateNumber}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: Vehicles */}
      {activeTab === 'vehicles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map(vh => (
            <div key={vh.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                    كود: {vh.code}
                  </span>
                  <h3 className="font-bold text-slate-800 text-sm block mt-1.5">{vh.type}</h3>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  vh.status === 'on_trip' ? 'bg-amber-50 text-amber-700' :
                  vh.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                  {vh.status === 'on_trip' ? 'في رحلة نقل' :
                   vh.status === 'active' ? 'جاهز بالساحة' : 'تحت الصيانة'}
                </span>
              </div>
              <div className="pt-2 border-t text-xs font-medium space-y-1.5 text-slate-600">
                <p>السائق الافتراضي: <strong className="text-slate-800">{vh.driverName}</strong></p>
                <p>اللوحات المرورية: <strong className="text-slate-800 font-mono">{vh.plateNumber}</strong></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: Drivers */}
      {activeTab === 'drivers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map(dr => (
            <div key={dr.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-slate-700">
                    <User className="w-5 h-5 text-[#0F4C81]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">{dr.name}</h3>
                    <p className="text-[10px] text-slate-400">قسم اللوجستيات والحركة</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  dr.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {dr.status === 'active' ? 'متاح للرحلات' : 'إجازة / غير متوفر'}
                </span>
              </div>
              <div className="pt-2 border-t text-xs font-semibold text-slate-600 space-y-1.5">
                <p>الهاتف المحمول: <span className="font-mono text-slate-800">{dr.phone}</span></p>
                <p>رخصة القيادة الثقيلة: <span className="text-slate-800 font-medium">{dr.licenseNumber}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: Trips */}
      {activeTab === 'trips' && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 font-bold text-slate-700">رقم الرحلة</th>
                  <th className="px-6 py-4 font-bold text-slate-700">المعدة (الونش) والجرار</th>
                  <th className="px-6 py-4 font-bold text-slate-700">السائق المعتمد</th>
                  <th className="px-6 py-4 font-bold text-slate-700">مسار النقل الموقعي</th>
                  <th className="px-6 py-4 font-bold text-slate-700">ساعة وتاريخ المغادرة</th>
                  <th className="px-6 py-4 font-bold text-slate-700">حالة النقل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrips.map(trip => (
                  <tr key={trip.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#0F4C81]">{trip.tripNo}</td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-slate-800 block">{trip.craneName}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">الجرار: {trip.vehicleCode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{trip.driverName}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>من: {trip.departureGate}</span>
                        <ArrowRightLeft className="w-3 h-3 text-slate-400 mx-1" />
                        <span className="font-bold text-[#F7941D]">إلى: {trip.destination}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500 font-bold">{trip.departureTime}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        trip.status === 'active' ? 'bg-amber-50 text-amber-700 animate-pulse' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          trip.status === 'active' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        {trip.status === 'active' ? 'متحرك على الطريق' : 'وصل بأمان'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Trip Analytics */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">تحليل وجهات رحلات النقل الموقعي للأوناش</h3>
              <p className="text-xs text-slate-400">إحصاء عدد الرحلات الموجهة للمواقع والمشاريع الكبرى</p>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Bar name="عدد الرحلات" dataKey="count" fill="#0F4C81" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-between text-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">معدلات السلامة والأمان للرحلات</h3>
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 flex justify-between items-center">
                <span>رحلات بدون حوادث (صحيحة):</span>
                <span className="font-extrabold text-sm">١٠٠٪</span>
              </div>
              <div className="p-3 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 flex justify-between items-center">
                <span>تغطية تتبع الـ GPS للرحلات:</span>
                <span className="font-extrabold text-sm">٩٨.٥٪</span>
              </div>
              <div className="p-3 bg-[#F7941D]/10 text-orange-800 rounded-xl border border-orange-100 flex justify-between items-center">
                <span>معدل الالتزام بجدول التحرك:</span>
                <span className="font-extrabold text-sm">٩٤.٢٪</span>
              </div>
            </div>
            <p className="text-slate-400 font-light leading-relaxed">
              تحسب معدلات كفاءة الرحلات بناء على مطابقة الفحص الأمني للبوابة وتأكيد استلام الملحقات عند الوصول.
            </p>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Performance Reports */}
      {activeTab === 'performanceReports' && (
        <CranePerformanceReports cranes={cranes} />
      )}

      {/* TAB CONTENT: Route Optimization */}
      {activeTab === 'routeOptimization' && (
        <RouteOptimizer cranes={cranes} />
      )}

      {/* Add Modal Forms */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-100 overflow-hidden text-right">
            <div className="bg-[#0F4C81] p-6 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {activeTab === 'cranes' ? 'تعريف تسجيل ونش بالأسطول' :
                 activeTab === 'vehicles' ? 'تعريف مقطورة / جرار ثقيل' :
                 activeTab === 'drivers' ? 'تسجيل سائق نقل ثقيل' : 'جدولة وتكليف رحلة نقل'}
              </h3>
              <button onClick={() => setShowAddForm(false)} className="text-white hover:bg-white/10 p-1 font-bold text-lg">×</button>
            </div>

            {/* FORM: Crane */}
            {activeTab === 'cranes' && (
              <form onSubmit={handleCreateCrane} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 mb-1.5">كود الونش</label>
                    <input type="text" required value={craneCode} onChange={e => setCraneCode(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1.5">النوع والحمولة (جهاز الرفع)</label>
                    <input type="text" required placeholder="مثال: ونش تلسكوبي ليبهير" value={craneName} onChange={e => setCraneName(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 mb-1.5">الموديل الفني للمصنع</label>
                    <input type="text" required placeholder="Liebherr LTM 1120" value={craneModel} onChange={e => setCraneModel(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1.5">أقصى طاقة رفع (بالأطنان)</label>
                    <input type="number" required placeholder="120" value={craneCap} onChange={e => setCraneCap(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 mb-1.5">رقم اللوحات المرورية</label>
                    <input type="text" required placeholder="أ ب ج ١٢٣٤" value={cranePlates} onChange={e => setCranePlates(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1.5">المشغل المعين (Operator)</label>
                    <input type="text" required placeholder="كابتن ممدوح الجوهري" value={craneOp} onChange={e => setCraneOp(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button type="submit" className="flex-1 py-2 px-4 bg-[#0F4C81] text-white rounded-xl font-bold">حفظ الونش بالأسطول</button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-2 bg-slate-100 rounded-xl">إلغاء</button>
                </div>
              </form>
            )}

            {/* FORM: Vehicle */}
            {activeTab === 'vehicles' && (
              <form onSubmit={handleCreateVehicle} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block text-slate-600 mb-1.5">كود الشاحنة</label>
                  <input type="text" required value={vhCode} onChange={e => setVhCode(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1.5">نوع الشاحنة والجرار</label>
                  <input type="text" required placeholder="مثال: جرار مرسيدس اكتروس" value={vhType} onChange={e => setVhType(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 mb-1.5">رقم لوحات المرور</label>
                    <input type="text" required placeholder="ي ص ر ٤٣٢١" value={vhPlates} onChange={e => setVhPlates(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1.5">السائق الافتراضي</label>
                    <input type="text" required placeholder="أحمد عبد الحفيظ" value={vhDriver} onChange={e => setVhDriver(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button type="submit" className="flex-1 py-2 px-4 bg-[#0F4C81] text-white rounded-xl font-bold">تسجيل المركبة</button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-2 bg-slate-100 rounded-xl">إلغاء</button>
                </div>
              </form>
            )}

            {/* FORM: Driver */}
            {activeTab === 'drivers' && (
              <form onSubmit={handleCreateDriver} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block text-slate-600 mb-1.5">الاسم الرباعي للسائق</label>
                  <input type="text" required placeholder="مثال: عصام السيد محمود" value={drName} onChange={e => setDrName(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1.5">رقم الهاتف المحمول بمصر</label>
                  <input type="text" required placeholder="010XXXXXXXX" value={drPhone} onChange={e => setDrPhone(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1.5">درجة رخصة القيادة الثقيلة ورقمها</label>
                  <input type="text" required placeholder="درجة أولى - رخصة رقم ٣٤٨٩" value={drLicense} onChange={e => setDrLicense(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div className="flex gap-2 pt-4">
                  <button type="submit" className="flex-1 py-2 px-4 bg-[#0F4C81] text-white rounded-xl font-bold">تسجيل السائق</button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-2 bg-slate-100 rounded-xl">إلغاء</button>
                </div>
              </form>
            )}

            {/* FORM: Trip */}
            {activeTab === 'trips' && (
              <form onSubmit={handleCreateTrip} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 mb-1.5">رقم الرحلة التلقائي</label>
                    <input type="text" required value={tripNo} onChange={e => setTripNo(e.target.value)} className="w-full px-4 py-2 border rounded-xl font-mono font-bold" />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1.5">الرافعة (الونش) المطلوب نقله</label>
                    <select required value={tripCraneId} onChange={e => setTripCraneId(e.target.value)} className="w-full p-2 border rounded-xl bg-white">
                      <option value="">-- اختر الونش --</option>
                      {cranes.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 mb-1.5">السائق المعتمد للرحلة</label>
                    <select required value={tripDriverId} onChange={e => setTripDriverId(e.target.value)} className="w-full p-2 border rounded-xl bg-white">
                      <option value="">-- اختر السائق --</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1.5">رأس المقطورة/الجرار المخصص</label>
                    <select required value={tripVehicleId} onChange={e => setTripVehicleId(e.target.value)} className="w-full p-2 border rounded-xl bg-white">
                      <option value="">-- اختر المركبة --</option>
                      {vehicles.filter(v => v.status === 'active').map(v => <option key={v.id} value={v.id}>{v.type} ({v.code})</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 mb-1.5">بوابة الخروج والانطلاق</label>
                    <input type="text" required value={tripFrom} onChange={e => setTripDeparture(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1.5">جهة الوصول النهائية والمشروع</label>
                    <input type="text" required placeholder="مثال: موقع الأرصفة الجديدة بميناء الإسكندرية" value={tripTo} onChange={e => setTripDestination(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button type="submit" className="flex-1 py-2 px-4 bg-[#0F4C81] text-white rounded-xl font-bold">جدولة الرحلة وتكليف السائق</button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-2 bg-slate-100 rounded-xl">إلغاء</button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
