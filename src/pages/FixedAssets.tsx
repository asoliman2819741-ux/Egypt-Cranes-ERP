import React, { useState, useMemo } from 'react';
import { FixedAsset, AssetMaintenanceLog, CostCenter } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Building2, Plus, Search, Archive, AlertTriangle, ArrowUpRight, 
  ArrowDownRight, Landmark, Wrench, MapPin, Calculator, Calendar, 
  DollarSign, Clock, Settings, X, CheckCircle2, ChevronRight, RefreshCw, Trash2,
  QrCode, Camera, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FixedAssetsProps {
  fixedAssets: FixedAsset[];
  costCenters: CostCenter[];
  onAddFixedAsset: (newAsset: FixedAsset) => void;
  onUpdateFixedAsset: (updatedAsset: FixedAsset) => void;
  onDeleteFixedAsset: (assetId: string) => void;
}

export default function FixedAssets({ 
  fixedAssets, 
  costCenters, 
  onAddFixedAsset, 
  onUpdateFixedAsset,
  onDeleteFixedAsset
}: FixedAssetsProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedAssetId, setSelectedAssetId] = useState<string>(fixedAssets[0]?.id || '');
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'depreciation' | 'maintenance' | 'location' | 'qrcode'>('depreciation');

  // QR and Smart Field Inventory Scanning States
  const [isScanning, setIsScanning] = useState(false);
  const [scanSimCode, setScanSimCode] = useState('');
  const [scanResultAsset, setScanResultAsset] = useState<FixedAsset | null>(null);

  // Handle Simulated Scan Complete
  const handleSimulateScanComplete = (codeToScan: string) => {
    const asset = fixedAssets.find(a => a.code === codeToScan);
    if (asset) {
      setScanResultAsset(asset);
    } else {
      alert('لم يتم العثور على أصل ثابت مطابق لهذا الرمز.');
    }
  };

  // Handle Confirm Inventory Match and save to history log
  const handleConfirmInventoryRecord = () => {
    if (!scanResultAsset) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const newLog: AssetMaintenanceLog = {
      id: `inv-${Date.now()}`,
      date: todayStr,
      type: 'جرد ميداني',
      description: `تم إثبات مطابقة الرمز الاستجابة السريعة (QR Code) والجرد الميداني وتأكيد تواجد الأصل في: [${scanResultAsset.location}]`,
      cost: 0,
      performer: 'مسؤول جرد الأصول الثابتة الميداني',
      status: 'completed'
    };

    const updatedAsset: FixedAsset = {
      ...scanResultAsset,
      lastInventoryDate: todayStr,
      maintenanceLog: [newLog, ...scanResultAsset.maintenanceLog]
    };

    onUpdateFixedAsset(updatedAsset);
    alert(`تم تأكيد جرد الأصل "${scanResultAsset.nameAr}" بنجاح وتسجيل العملية في سجل التدقيق الميداني للأصل!`);
    
    // Clear and reset scanning states
    setScanResultAsset(null);
    setScanSimCode('');
    setIsScanning(false);
  };

  // New Asset Form State
  const [code, setCode] = useState(`EC-FA-${String(fixedAssets.length + 1).padStart(3, '0')}`);
  const [nameAr, setNameAr] = useState('');
  const [category, setCategory] = useState<FixedAsset['category']>('workshop_machinery');
  const [purchaseDate, setPurchaseDate] = useState('2026-01-01');
  const [purchaseCost, setPurchaseCost] = useState<number>(100000);
  const [salvageValue, setSalvageValue] = useState<number>(10000);
  const [usefulLife, setUsefulLife] = useState<number>(5);
  const [depreciationMethod, setDepreciationMethod] = useState<FixedAsset['depreciationMethod']>('straight_line');
  const [decliningRate, setDecliningRate] = useState<number>(20);
  const [location, setLocation] = useState('ورشة ومخازن الشركة الرئيسية بالجيزة');

  // New Maintenance Form State
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [maintDate, setMaintDate] = useState(new Date().toISOString().split('T')[0]);
  const [maintType, setMaintType] = useState('صيانة دورية');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintCost, setMaintCost] = useState<number>(1500);
  const [maintPerformer, setMaintPerformer] = useState('');
  const [maintStatus, setMaintStatus] = useState<'completed' | 'pending'>('completed');

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return fixedAssets.filter(asset => {
      const matchesSearch = asset.nameAr.toLowerCase().includes(search.toLowerCase()) || 
                            asset.code.toLowerCase().includes(search.toLowerCase()) ||
                            asset.location.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;
      const matchesLocation = locationFilter === 'all' || asset.location === locationFilter;
      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [fixedAssets, search, categoryFilter, locationFilter]);

  // Selected Asset
  const selectedAsset = useMemo(() => {
    return fixedAssets.find(a => a.id === selectedAssetId) || filteredAssets[0] || fixedAssets[0];
  }, [fixedAssets, selectedAssetId, filteredAssets]);

  // Unique locations for filter
  const uniqueLocations = useMemo(() => {
    const locs = new Set<string>();
    fixedAssets.forEach(a => locs.add(a.location));
    return Array.from(locs);
  }, [fixedAssets]);

  // Categories helper
  const categoryLabels: Record<FixedAsset['category'], string> = {
    workshop_machinery: 'أجهزة ومعدات ورش',
    admin_vehicles: 'سيارات إدارية وحركة',
    it_networks: 'شبكات وأجهزة كمبيوتر',
    office_furniture: 'أثاث ومستلزمات مكتبية',
    other: 'أصول أخرى ومرافق'
  };

  const categoryColors: Record<FixedAsset['category'], string> = {
    workshop_machinery: 'bg-blue-50 text-blue-700 border-blue-200',
    admin_vehicles: 'bg-amber-50 text-amber-700 border-amber-200',
    it_networks: 'bg-purple-50 text-purple-700 border-purple-200',
    office_furniture: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    other: 'bg-slate-50 text-slate-700 border-slate-200'
  };

  // Helper to calculate depreciation schedule year-by-year
  const calculateSchedule = (asset: FixedAsset) => {
    if (!asset) return [];
    const schedule = [];
    const cost = asset.purchaseCost;
    const salvage = asset.salvageValue;
    const life = asset.usefulLife;
    const method = asset.depreciationMethod;
    const startYear = new Date(asset.purchaseDate).getFullYear();

    let accumDep = 0;
    let bookValue = cost;

    if (method === 'straight_line') {
      const annualDep = (cost - salvage) / life;
      for (let i = 1; i <= life; i++) {
        const year = startYear + i;
        const currentDep = Math.min(annualDep, bookValue - salvage);
        accumDep += currentDep;
        bookValue -= currentDep;
        schedule.push({
          year,
          depreciationExpense: currentDep,
          accumulatedDepreciation: accumDep,
          bookValue: Math.max(bookValue, salvage)
        });
      }
    } else {
      // Declining Balance
      const rate = (asset.decliningRate || 20) / 100;
      for (let i = 1; i <= life; i++) {
        const year = startYear + i;
        let currentDep = bookValue * rate;
        if (bookValue - currentDep < salvage) {
          currentDep = Math.max(0, bookValue - salvage);
        }
        accumDep += currentDep;
        bookValue -= currentDep;
        schedule.push({
          year,
          depreciationExpense: currentDep,
          accumulatedDepreciation: accumDep,
          bookValue: Math.max(bookValue, salvage)
        });
        if (bookValue <= salvage) break;
      }
    }
    return schedule;
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    const totalCost = fixedAssets.reduce((sum, a) => sum + a.purchaseCost, 0);
    const totalAccumDep = fixedAssets.reduce((sum, a) => sum + a.accumulatedDepreciation, 0);
    const totalBookVal = fixedAssets.reduce((sum, a) => sum + a.currentValue, 0);
    const pendingMaint = fixedAssets.reduce((sum, a) => {
      const pending = a.maintenanceLog.filter(l => l.status === 'pending').length;
      return sum + pending;
    }, 0);

    return {
      totalCost,
      totalAccumDep,
      totalBookVal,
      pendingMaint
    };
  }, [fixedAssets]);

  // Add Asset Handler
  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) {
      alert('الرجاء إدخال اسم الأصل!');
      return;
    }

    // Determine initial accumulated depreciation up to current year (2026)
    const startYear = new Date(purchaseDate).getFullYear();
    const currentYear = 2026;
    const yearsElapsed = Math.max(0, currentYear - startYear);

    let accumDep = 0;
    let bookValue = purchaseCost;

    if (depreciationMethod === 'straight_line') {
      const annualDep = (purchaseCost - salvageValue) / usefulLife;
      accumDep = Math.min(annualDep * yearsElapsed, purchaseCost - salvageValue);
      bookValue = purchaseCost - accumDep;
    } else {
      const rate = decliningRate / 100;
      for (let i = 0; i < yearsElapsed; i++) {
        let dep = bookValue * rate;
        if (bookValue - dep < salvageValue) {
          dep = Math.max(0, bookValue - salvageValue);
        }
        accumDep += dep;
        bookValue -= dep;
      }
    }

    const newAsset: FixedAsset = {
      id: `as-${Date.now()}`,
      code,
      nameAr,
      category,
      purchaseDate,
      purchaseCost,
      salvageValue,
      usefulLife,
      depreciationMethod,
      decliningRate: depreciationMethod === 'declining_balance' ? decliningRate : undefined,
      location,
      currentValue: bookValue,
      accumulatedDepreciation: accumDep,
      maintenanceLog: []
    };

    onAddFixedAsset(newAsset);
    alert('تم تسجيل الأصل الثابت الجديد بنجاح في النظام!');
    setShowAddForm(false);
    
    // Reset fields
    setNameAr('');
    setPurchaseCost(100000);
    setSalvageValue(10000);
    setUsefulLife(5);
    setDepreciationMethod('straight_line');
    setDecliningRate(20);
    setCode(`EC-FA-${String(fixedAssets.length + 2).padStart(3, '0')}`);
  };

  // Add Maintenance Log Handler
  const handleAddMaintenanceLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintDesc.trim()) {
      alert('الرجاء إدخال تفاصيل الصيانة!');
      return;
    }

    const newLog: AssetMaintenanceLog = {
      id: `ml-${Date.now()}`,
      date: maintDate,
      type: maintType,
      description: maintDesc,
      cost: maintCost,
      performer: maintPerformer || 'القسم الفني الداخلي',
      status: maintStatus
    };

    const updatedAsset: FixedAsset = {
      ...selectedAsset,
      maintenanceLog: [newLog, ...selectedAsset.maintenanceLog]
    };

    onUpdateFixedAsset(updatedAsset);
    alert('تم تسجيل عملية الصيانة للأصل بنجاح!');
    setShowMaintForm(false);
    setMaintDesc('');
    setMaintCost(1500);
  };

  // Location Transfer Handler
  const handleLocationTransfer = (newLoc: string) => {
    if (!newLoc) return;
    if (newLoc === selectedAsset.location) {
      alert('الأصل موجود بالفعل في هذا الموقع!');
      return;
    }

    if (confirm(`هل أنت متأكد من نقل الأصل "${selectedAsset.nameAr}" إلى موقع: ${newLoc}؟`)) {
      const transferLog: AssetMaintenanceLog = {
        id: `tr-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'نقل وتغيير موقع',
        description: `تم نقل الأصل من [${selectedAsset.location}] إلى الموقع الجديد [${newLoc}]`,
        cost: 0,
        performer: 'إدارة الحركة والخدمات',
        status: 'completed'
      };

      const updatedAsset: FixedAsset = {
        ...selectedAsset,
        location: newLoc,
        maintenanceLog: [transferLog, ...selectedAsset.maintenanceLog]
      };

      onUpdateFixedAsset(updatedAsset);
      alert('تم تحديث موقع الأصل وتسجيل العملية في سجل النشاط المرفق!');
    }
  };

  const scheduleData = selectedAsset ? calculateSchedule(selectedAsset) : [];

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 bg-white p-6 rounded-2xl shadow-3xs">
        <div>
          <div className="flex items-center gap-2 text-[#0F4C81]">
            <Building2 className="w-6 h-6" />
            <h1 className="text-2xl font-bold text-slate-900">إدارة الأصول الثابتة (Fixed Assets)</h1>
          </div>
          <p className="text-slate-500 mt-1 text-sm font-semibold">متابعة الأصول التشغيلية والإدارية غير الأوناش، واحتساب إهلاكاتها، وسجل مواقعها وصياناتها</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="px-5 py-2.5 bg-[#0F4C81] text-white font-bold text-sm rounded-xl hover:bg-[#0c3d67] transition-all flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg hover:scale-[1.01] self-start md:self-center"
        >
          <Plus className="w-5 h-5 text-[#F7941D]" /> 
          <span>تسجيل أصل ثابت جديد</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Cost */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-extrabold block">إجمالي تكلفة اقتناء الأصول</span>
            <span className="text-xl font-black text-slate-800">{kpis.totalCost.toLocaleString('ar-EG')} ج.م</span>
            <span className="text-[10px] text-slate-400 font-semibold block">سعر الشراء الإجمالي المسجل</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Accum Depreciation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-extrabold block">إجمالي الإهلاك المتراكم</span>
            <span className="text-xl font-black text-rose-600">{kpis.totalAccumDep.toLocaleString('ar-EG')} ج.م</span>
            <span className="text-[10px] text-rose-500/80 font-bold flex items-center gap-0.5">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>معدل الخسارة المقدرة للمعدات</span>
            </span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <Calculator className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Net Book Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-extrabold block">صافي القيمة الدفترية الحالية</span>
            <span className="text-xl font-black text-emerald-600">{kpis.totalBookVal.toLocaleString('ar-EG')} ج.م</span>
            <span className="text-[10px] text-emerald-500/80 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>القيمة المتبقية النشطة بالدفاتر</span>
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Pending Maintenance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-extrabold block">صيانات مجدولة / معلقة</span>
            <span className={`text-xl font-black ${kpis.pendingMaint > 0 ? 'text-amber-600' : 'text-slate-700'}`}>{kpis.pendingMaint} عمليات</span>
            <span className="text-[10px] text-slate-400 font-semibold block">متابعة الفحوصات الدورية للأصول</span>
          </div>
          <div className={`p-3 rounded-2xl ${kpis.pendingMaint > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
            <Wrench className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Control Panel: Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="البحث بكود الأصل، اسم الآلة أو موقع التواجد..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0F4C81] focus:border-[#0F4C81] rounded-xl text-xs font-semibold"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-48">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0F4C81]"
          >
            <option value="all">كل الفئات والتصنيفات</option>
            <option value="workshop_machinery">معدات الورش ومكابس</option>
            <option value="admin_vehicles">سيارات إدارية وحركة</option>
            <option value="it_networks">أجهزة كمبيوتر وشبكات</option>
            <option value="office_furniture">أثاث ومكاتب إدارية</option>
            <option value="other">أصول أخرى</option>
          </select>
        </div>

        {/* Location Filter */}
        <div className="w-full md:w-56">
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0F4C81]"
          >
            <option value="all">كل مواقع التواجد</option>
            {uniqueLocations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Assets List Table: 7 cols */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-3xs overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-xs font-black text-slate-800">قائمة الأصول الثابتة النشطة ({filteredAssets.length})</span>
            <span className="text-[10px] font-bold text-slate-400">انقر على أي أصل لعرض تفاصيله وإهلاكه</span>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-extrabold">
                  <th className="py-3 px-4">كود الأصل</th>
                  <th className="py-3 px-4">اسم الأصل والبيان</th>
                  <th className="py-3 px-4">الفئة</th>
                  <th className="py-3 px-4 text-left">التكلفة</th>
                  <th className="py-3 px-4 text-left">الدفترية الحالية</th>
                  <th className="py-3 px-4">الموقع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                      لا توجد أصول ثابتة مطابقة للبحث أو الفلتر المختار.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map(asset => {
                    const isSelected = selectedAsset?.id === asset.id;
                    return (
                      <tr 
                        key={asset.id}
                        onClick={() => setSelectedAssetId(asset.id)}
                        className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/40 border-r-4 border-r-[#0F4C81]' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{asset.code}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800 max-w-[200px] truncate" title={asset.nameAr}>
                          {asset.nameAr}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${categoryColors[asset.category]}`}>
                            {categoryLabels[asset.category]}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-left font-mono font-bold text-slate-600">
                          {asset.purchaseCost.toLocaleString()} ج.م
                        </td>
                        <td className="py-3.5 px-4 text-left font-mono font-black text-emerald-600">
                          {asset.currentValue.toLocaleString()} ج.م
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-semibold max-w-[150px] truncate" title={asset.location}>
                          {asset.location}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Asset details, depreciation calculator, & maintenance: 5 cols */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {selectedAsset ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-3xs p-5 space-y-5 flex flex-col">
              
              {/* Selected Asset Header */}
              <div className="border-b pb-4 space-y-1.5">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs font-black text-[#0F4C81] bg-blue-50 px-2 py-0.5 rounded-lg border">
                    {selectedAsset.code}
                  </span>
                  <button 
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من رغبتك في حذف الأصل الثابت [${selectedAsset.nameAr}]؟`)) {
                        onDeleteFixedAsset(selectedAsset.id);
                        alert('تم حذف الأصل بنجاح من سجلات الشركة الموثقة.');
                      }
                    }}
                    className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                    title="حذف الأصل"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-black text-sm text-slate-800 leading-normal">{selectedAsset.nameAr}</h3>
                <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>الموقع الحالي: {selectedAsset.location}</span>
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3.5 text-xs bg-slate-50 p-4 border rounded-xl">
                <div>
                  <span className="text-slate-400 block mb-0.5">تاريخ الشراء:</span>
                  <span className="font-mono font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {selectedAsset.purchaseDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">طريقة الإهلاك:</span>
                  <span className="font-extrabold text-[#0F4C81] flex items-center gap-1">
                    <Calculator className="w-3.5 h-3.5 text-slate-400" />
                    {selectedAsset.depreciationMethod === 'straight_line' ? 'قسط ثابت' : `قسط متناقص (${selectedAsset.decliningRate}%)`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">تكلفة الاقتناء:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedAsset.purchaseCost.toLocaleString()} ج.م</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">العمر الإنتاجي:</span>
                  <span className="font-extrabold text-slate-700">{selectedAsset.usefulLife} سنوات</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">القيمة التخريدية المقدرة:</span>
                  <span className="font-mono font-semibold text-slate-500">{selectedAsset.salvageValue.toLocaleString()} ج.m</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">الإهلاك المتراكم:</span>
                  <span className="font-mono font-bold text-rose-500">{selectedAsset.accumulatedDepreciation.toLocaleString()} ج.م</span>
                </div>
              </div>

              {/* Subtabs for Details */}
              <div className="flex border-b border-slate-100 text-xs font-bold text-slate-500">
                <button
                  onClick={() => setActiveDetailTab('depreciation')}
                  className={`flex-1 pb-2.5 text-center transition-all ${
                    activeDetailTab === 'depreciation' ? 'text-[#0F4C81] border-b-2 border-b-[#0F4C81]' : 'hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5" />
                    <span>جدول الإهلاك السنوي</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveDetailTab('maintenance')}
                  className={`flex-1 pb-2.5 text-center transition-all ${
                    activeDetailTab === 'maintenance' ? 'text-[#0F4C81] border-b-2 border-b-[#0F4C81]' : 'hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>سجل الصيانة</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveDetailTab('location')}
                  className={`flex-1 pb-2.5 text-center transition-all ${
                    activeDetailTab === 'location' ? 'text-[#0F4C81] border-b-2 border-b-[#0F4C81]' : 'hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>الموقع والتحويلات</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveDetailTab('qrcode')}
                  className={`flex-1 pb-2.5 text-center transition-all ${
                    activeDetailTab === 'qrcode' ? 'text-[#0F4C81] border-b-2 border-b-[#0F4C81]' : 'hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>رمز QR والـجرد السريع</span>
                  </div>
                </button>
              </div>

              {/* Tab Content Box */}
              <div className="flex-1 min-h-[220px]">
                
                {/* TAB 1: Depreciation calculator schedule */}
                {activeDetailTab === 'depreciation' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                      <span>عرض الإسقاط المحاسبي السنوي للأصل</span>
                      <span className="text-[#0F4C81]">طريقة حساب: {selectedAsset.depreciationMethod === 'straight_line' ? 'قسط ثابت' : 'متناقص'}</span>
                    </div>

                    <div className="border border-slate-100 rounded-xl overflow-hidden text-[11px]">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b text-slate-400 font-bold">
                            <th className="py-2 px-3 text-center">السنة</th>
                            <th className="py-2 px-3 text-left">قسط الإهلاك السنوي</th>
                            <th className="py-2 px-3 text-left">الإهلاك المتراكم</th>
                            <th className="py-2 px-3 text-left">القيمة الدفترية</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-semibold font-mono text-slate-600">
                          {scheduleData.map((row, idx) => {
                            const isCurrentYear = row.year === 2026;
                            return (
                              <tr key={idx} className={isCurrentYear ? 'bg-amber-50/50 font-bold text-amber-900 border-y border-amber-100' : 'hover:bg-slate-50/20'}>
                                <td className="py-2 px-3 text-center flex items-center justify-center gap-1">
                                  <span>{row.year}</span>
                                  {isCurrentYear && <span className="bg-amber-500 text-slate-950 font-sans text-[8px] px-1 py-0.2 rounded font-black">الحالية</span>}
                                </td>
                                <td className="py-2 px-3 text-left">{row.depreciationExpense.toLocaleString('ar-EG', {maximumFractionDigits: 0})} ج.م</td>
                                <td className="py-2 px-3 text-left">{row.accumulatedDepreciation.toLocaleString('ar-EG', {maximumFractionDigits: 0})} ج.م</td>
                                <td className="py-2 px-3 text-left font-black text-emerald-600">{row.bookValue.toLocaleString('ar-EG', {maximumFractionDigits: 0})} ج.م</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 2: Maintenance Log */}
                {activeDetailTab === 'maintenance' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-400 font-bold">سجل الصيانة الوقائية والطارئة للأصل</span>
                      <button 
                        onClick={() => setShowMaintForm(!showMaintForm)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#0F4C81] rounded-lg border text-[10px] font-black cursor-pointer transition-all flex items-center gap-1"
                      >
                        {showMaintForm ? 'إلغاء' : <><Plus className="w-3.5 h-3.5" /> تسجيل عملية صيانة</>}
                      </button>
                    </div>

                    {showMaintForm ? (
                      <form onSubmit={handleAddMaintenanceLog} className="bg-slate-50 border p-3.5 rounded-xl space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">التاريخ</label>
                            <input 
                              type="date" 
                              value={maintDate}
                              onChange={(e) => setMaintDate(e.target.value)}
                              className="w-full p-1.5 border rounded-lg bg-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">نوع العملية</label>
                            <select
                              value={maintType}
                              onChange={(e) => setMaintType(e.target.value)}
                              className="w-full p-1.5 border rounded-lg bg-white text-xs font-bold"
                            >
                              <option value="صيانة دورية">صيانة دورية</option>
                              <option value="إصلاح طارئ">إصلاح طارئ</option>
                              <option value="فحص ومعايرة">فحص ومعايرة</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">الجهة المنفذة</label>
                          <input 
                            type="text" 
                            placeholder="اسم الفني أو الشركة الخارجية المنفذة"
                            value={maintPerformer}
                            onChange={(e) => setMaintPerformer(e.target.value)}
                            className="w-full p-1.5 border rounded-lg bg-white text-xs font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">البيان والتفاصيل</label>
                          <textarea
                            placeholder="اكتب الإجراءات الفنية التي تمت بالتفصيل..."
                            value={maintDesc}
                            onChange={(e) => setMaintDesc(e.target.value)}
                            rows={2}
                            className="w-full p-1.5 border rounded-lg bg-white text-xs font-semibold"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">التكلفة (ج.م)</label>
                            <input 
                              type="number" 
                              value={maintCost}
                              onChange={(e) => setMaintCost(Number(e.target.value))}
                              className="w-full p-1.5 border rounded-lg bg-white text-xs font-mono font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">الحالة</label>
                            <select
                              value={maintStatus}
                              onChange={(e) => setMaintStatus(e.target.value as any)}
                              className="w-full p-1.5 border rounded-lg bg-white text-xs font-bold"
                            >
                              <option value="completed">منجزة وسليمة</option>
                              <option value="pending">مجدولة / معلقة</option>
                            </select>
                          </div>
                        </div>

                        <button 
                          type="submit"
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg transition-colors text-xs cursor-pointer"
                        >
                          تأكيد التسجيل في الدفتر الفني
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                        {selectedAsset.maintenanceLog.length === 0 ? (
                          <div className="text-center text-slate-400 font-semibold py-8 text-[11px]">
                            لا يوجد سجلات صيانة مسجلة لهذا الأصل بعد.
                          </div>
                        ) : (
                          selectedAsset.maintenanceLog.map(log => (
                            <div key={log.id} className="p-3 bg-slate-50 border rounded-xl text-[11px] space-y-1.5">
                              <div className="flex justify-between items-center font-bold">
                                <span className={`px-2 py-0.5 rounded text-[9px] ${
                                  log.type === 'نقل وتغيير موقع' ? 'bg-indigo-100 text-indigo-700' :
                                  log.type === 'إصلاح طارئ' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-[#0F4C81]'
                                }`}>
                                  {log.type}
                                </span>
                                <span className="font-mono text-slate-400">{log.date}</span>
                              </div>
                              <p className="text-slate-700 font-bold">{log.description}</p>
                              <div className="flex justify-between items-center text-slate-500 text-[10px]">
                                <span>المنفذ: <strong className="text-slate-700">{log.performer}</strong></span>
                                <span>التكلفة: <strong className="text-emerald-600 font-mono">{log.cost.toLocaleString()} ج.م</strong></span>
                              </div>
                              {log.status === 'pending' && (
                                <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded text-[9px] font-bold">مجدولة / قيد التنفيذ</span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: Location transfer */}
                {activeDetailTab === 'location' && (
                  <div className="space-y-2.5">
                    <span className="text-[11px] text-slate-400 font-extrabold block">نقل وتوجيه الأصل لموقع/مشروع آخر:</span>
                    <div className="grid grid-cols-1 gap-2">
                      {costCenters.map(cc => (
                        <button
                          key={cc.id}
                          onClick={() => handleLocationTransfer(cc.nameAr)}
                          className="p-2.5 hover:bg-slate-50 border rounded-xl text-xs font-bold text-right flex items-center justify-between group cursor-pointer transition-all hover:border-[#0F4C81]/30"
                        >
                          <span className="text-slate-700">{cc.nameAr}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F4C81] group-hover:translate-x-[-2px] transition-transform" />
                        </button>
                      ))}
                      {/* Default Administration Location option */}
                      <button
                        onClick={() => handleLocationTransfer('المركز الإداري الرئيسي - الدقي')}
                        className="p-2.5 hover:bg-slate-50 border rounded-xl text-xs font-bold text-right flex items-center justify-between group cursor-pointer transition-all hover:border-[#0F4C81]/30"
                      >
                        <span className="text-slate-700">المركز الإداري الرئيسي - الدقي</span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F4C81] group-hover:translate-x-[-2px] transition-transform" />
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 4: QR Code & Mobile Inventory Decal */}
                {activeDetailTab === 'qrcode' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                      <span>الرمز التعريفي الفريد للأصل (Unique Asset QR Decal)</span>
                      <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 animate-bounce text-emerald-500" />
                        <span>جاهز للجرد الميداني</span>
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center space-y-3.5">
                      
                      {/* Interactive Printable Decal */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 text-slate-900 w-full max-w-[260px] flex flex-col items-center text-center space-y-2 shadow-2xs">
                        <span className="text-[8px] font-black tracking-wider text-slate-400 uppercase font-mono">EGYPT CRANES FIXED ASSET</span>
                        <div className="p-2 border border-slate-200 rounded-lg bg-white">
                          <QRCodeSVG 
                            value={JSON.stringify({
                              app: "EgyptCranes-ERP",
                              type: "fixed_asset",
                              id: selectedAsset.id,
                              code: selectedAsset.code,
                              name: selectedAsset.nameAr,
                              cost: selectedAsset.purchaseCost,
                              bookValue: selectedAsset.currentValue,
                              location: selectedAsset.location
                            })}
                            size={120}
                            fgColor="#0F4C81"
                            level="M"
                            includeMargin={true}
                          />
                        </div>
                        <span className="font-mono text-[9px] font-black text-slate-800">{selectedAsset.code}</span>
                        <span className="text-[10px] font-bold text-slate-600 max-w-[200px] truncate">{selectedAsset.nameAr}</span>
                        <span className="text-[8px] text-slate-400 font-mono">آخر جرد معتمد: {selectedAsset.lastInventoryDate || 'لم يجرد بعد'}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 w-full max-w-[260px]">
                        <button
                          type="button"
                          onClick={() => {
                            const printWindow = window.open('', '_blank');
                            if (!printWindow) {
                              alert('يرجى السماح بالنوافذ المنبثقة للطباعة.');
                              return;
                            }
                            printWindow.document.write(`
                              <html>
                                <head>
                                  <title>ملصق أصل ثابت ${selectedAsset.code}</title>
                                  <style>
                                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
                                    body { font-family: 'Inter', sans-serif; text-align: center; padding: 40px; direction: rtl; }
                                    .card { border: 2px solid #000; padding: 20px; display: inline-block; border-radius: 8px; }
                                  </style>
                                </head>
                                <body>
                                  <div class="card">
                                    <h3>مصر للأوناش - الأصول الثابتة</h3>
                                    <hr />
                                    <p>كود الأصل: <strong>\${selectedAsset.code}</strong></p>
                                    <p>اسم الأصل: <strong>\${selectedAsset.nameAr}</strong></p>
                                    <p>الموقع: <strong>\${selectedAsset.location}</strong></p>
                                    <div style="margin-top: 15px;">
                                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=\${encodeURIComponent(selectedAsset.code)}" />
                                    </div>
                                    <p style="font-size: 10px; color: #666; margin-top: 10px;">ملصق أصل رسمي معتمد للموقع</p>
                                  </div>
                                  <script>window.onload = function() { window.print(); window.close(); };</script>
                                </body>
                              </html>
                            `);
                            printWindow.document.close();
                          }}
                          className="flex-1 py-1.5 bg-[#0F4C81] hover:bg-[#0c3d67] text-white rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>طباعة الملصق 🖨️</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedAsset.code);
                            alert('تم نسخ كود الأصل للمحاكاة السريعة.');
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border rounded-lg text-[10px] font-bold transition-all text-slate-700 cursor-pointer"
                        >
                          <span>نسخ الكود</span>
                        </button>
                      </div>

                    </div>

                    {/* Camera Inventory Scanner Simulator */}
                    <div className="bg-indigo-50/40 border border-indigo-150 p-4 rounded-xl space-y-3.5">
                      <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-xs">
                        <Camera className="w-4 h-4 text-indigo-600 shrink-0 animate-pulse" />
                        <span>محاكي كاميرا الجرد الميداني السريع (HSE Scan)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold leading-normal">
                        يتيح هذا المحاكي للمشرفين مسح ملصق الأصول في الميدان لتأكيد تطابق البيانات وتسجيل تاريخ جرد دوري تلقائي في النظام.
                      </p>

                      {isScanning ? (
                        <div className="space-y-3">
                          {/* Beautiful Camera Viewfinder UI */}
                          <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center text-white">
                            {/* Scanning laser line animation */}
                            <div className="absolute inset-x-4 top-1/2 h-0.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                            
                            {/* Target frame corners */}
                            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

                            <div className="text-center p-4 z-10 space-y-2 bg-slate-900/80 rounded-xl max-w-xs border border-white/5">
                              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mx-auto" />
                              <p className="text-[10px] text-emerald-300 font-black animate-pulse">جاري فحص بث الكاميرا ورصد الرموز...</p>
                              <span className="text-[9px] text-slate-400 block font-bold">يمكنك تحديد كود الرمز بالأسفل لإتمام المسح بنجاح</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="block text-[10px] text-slate-500 font-extrabold">اختر الكود للمحاكاة الفورية:</label>
                            <div className="flex gap-2">
                              <select
                                value={scanSimCode}
                                onChange={(e) => setScanSimCode(e.target.value)}
                                className="flex-1 p-2 border border-slate-200 bg-white rounded-xl text-xs font-bold"
                              >
                                <option value="">-- اختر أصل من الأصول الميدانية --</option>
                                {fixedAssets.map(a => (
                                  <option key={a.id} value={a.code}>{a.nameAr} ({a.code})</option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => {
                                  if (!scanSimCode) {
                                    alert('يرجى تحديد أصل لمحاكاة مسح ملصقه.');
                                    return;
                                  }
                                  handleSimulateScanComplete(scanSimCode);
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors cursor-pointer"
                              >
                                إتمام المسح ⚡
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setIsScanning(false);
                                  setScanResultAsset(null);
                                }}
                                className="p-2 bg-slate-100 hover:bg-slate-200 border rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsScanning(true);
                            setScanSimCode(selectedAsset.code);
                          }}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                        >
                          <Camera className="w-4 h-4" />
                          <span>تشغيل كاميرا الفحص والجرد الميداني 📷</span>
                        </button>
                      )}

                      {/* Scan Results Display */}
                      {scanResultAsset && (
                        <div className="bg-emerald-50 border border-emerald-150 p-3.5 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1">
                          <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>تم مطابقة الرمز بنجاح! ({scanResultAsset.code})</span>
                          </div>
                          <div className="text-[10px] text-emerald-950 font-bold space-y-1">
                            <p>اسم المعدة: <strong className="text-slate-900">{scanResultAsset.nameAr}</strong></p>
                            <p>الموقع الجغرافي المسجل: <strong className="text-slate-900">{scanResultAsset.location}</strong></p>
                            <p>القيمة الدفترية النشطة: <strong className="text-emerald-700">{scanResultAsset.currentValue.toLocaleString()} ج.م</strong></p>
                          </div>
                          <div className="pt-1.5 border-t border-emerald-200/50 flex justify-end">
                            <button
                              type="button"
                              onClick={handleConfirmInventoryRecord}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-[10px] transition-colors cursor-pointer"
                            >
                              تأكيد مطابقة الجرد وتوقيع السجل الميداني ✅
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-3xs p-8 text-center text-slate-400">
              قم باختيار أصل من الجدول الأيمن لرؤية التفاصيل وسجلات الإهلاك والصيانات والمواقع هنا.
            </div>
          )}
        </div>

      </div>

      {/* 📥 نافذة تسجيل أصل جديد Add Asset Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col font-sans text-right dir-rtl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-[#0F4C81] rounded-xl border border-blue-100 shadow-3xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">استمارة تسجيل أصل ثابت جديد</h3>
                  <p className="text-[11px] text-slate-400 font-bold">تسجيل أصل غير الأوناش (مكابس، مولدات، سيارات إدارية) وتدشين حساب الإهلاك السنوي فورياً</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddForm(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateAsset} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Code */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">كود الأصل المرجعي</label>
                  <input 
                    type="text" 
                    value={code} 
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 font-mono font-bold text-xs"
                    required
                  />
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">اسم وبيان الأصل الثابت (*)</label>
                  <input 
                    type="text" 
                    placeholder="مثال: مكبس هيدروليكي 50 طن، سيارة شيفروليه"
                    value={nameAr} 
                    onChange={(e) => setNameAr(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white font-bold text-xs"
                    required
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">فئة الأصل الثابت</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white font-bold text-xs text-slate-700"
                  >
                    <option value="workshop_machinery">أجهزة ومعدات ورش ومخازن</option>
                    <option value="admin_vehicles">سيارات إدارية وحركة</option>
                    <option value="it_networks">أجهزة كمبيوتر وشبكات وسيرفرات</option>
                    <option value="office_furniture">أثاث ومستلزمات مكتبية</option>
                    <option value="other">أصول أخرى ومرافق</option>
                  </select>
                </div>

                {/* Location */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">موقع التواجد الأولي</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white font-bold text-xs text-slate-700"
                  >
                    {costCenters.map(cc => (
                      <option key={cc.id} value={cc.nameAr}>{cc.nameAr}</option>
                    ))}
                    <option value="المركز الإداري الرئيسي - الدقي">المركز الإداري الرئيسي - الدقي</option>
                    <option value="ورشة ومخازن الشركة الرئيسية بالجيزة">ورشة ومخازن الشركة الرئيسية بالجيزة</option>
                  </select>
                </div>

                {/* Purchase Date */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">تاريخ الشراء / بدء الاستخدام</label>
                  <input 
                    type="date" 
                    value={purchaseDate} 
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white text-xs font-mono font-bold text-slate-700"
                    required
                  />
                </div>

                {/* Purchase Cost */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">تكلفة الاقتناء / قيمة الشراء (ج.م) (*)</label>
                  <input 
                    type="number" 
                    value={purchaseCost} 
                    onChange={(e) => setPurchaseCost(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white font-mono font-bold text-xs text-slate-700"
                    min={1}
                    required
                  />
                </div>

                {/* Salvage Value */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">القيمة التخريدية المتوقعة بنهاية العمر (ج.م)</label>
                  <input 
                    type="number" 
                    value={salvageValue} 
                    onChange={(e) => setSalvageValue(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white font-mono font-bold text-xs text-slate-700"
                    min={0}
                    required
                  />
                </div>

                {/* Useful Life */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">العمر الإنتاجي للأصل (بالسنوات) (*)</label>
                  <input 
                    type="number" 
                    value={usefulLife} 
                    onChange={(e) => setUsefulLife(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white font-bold text-xs text-slate-700"
                    min={1}
                    required
                  />
                </div>

                {/* Depreciation Method */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">طريقة احتساب الإهلاك</label>
                  <select
                    value={depreciationMethod}
                    onChange={(e) => setDepreciationMethod(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white font-bold text-xs text-slate-700"
                  >
                    <option value="straight_line">طريقة القسط الثابت (Straight Line)</option>
                    <option value="declining_balance">طريقة القسط المتناقص (Declining Balance)</option>
                  </select>
                </div>

                {/* Declining Rate (conditionally shown) */}
                {depreciationMethod === 'declining_balance' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500">معدل الإهلاك السنوي (%)</label>
                    <input 
                      type="number" 
                      value={decliningRate} 
                      onChange={(e) => setDecliningRate(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white font-mono font-bold text-xs text-slate-700"
                      min={1}
                      max={99}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Form Footer Buttons */}
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl mt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black rounded-xl transition-all cursor-pointer"
                >
                  إلغاء التراجع
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-[#0F4C81] hover:bg-[#0c3d67] text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer"
                >
                  حفظ وتسجيل الأصل الثابت
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
