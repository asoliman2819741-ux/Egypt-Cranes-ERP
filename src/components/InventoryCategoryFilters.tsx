import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { 
  Search, Scan, Filter, Warehouse, Tag, Wrench, Layers, 
  RotateCcw, ArrowUpDown, LayoutGrid, List, AlertTriangle, 
  CheckCircle2, Bell, ShieldAlert, Sparkles, X, ChevronDown, 
  SlidersHorizontal, Coins, Boxes, Cpu, Droplets, Cog, Anchor, Disc, Package
} from 'lucide-react';

export interface CategoryFilterProps {
  inventoryItems: InventoryItem[];
  search: string;
  setSearch: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  selectedWarehouse: string;
  setSelectedWarehouse: (val: string) => void;
  itemTypeFilter: 'all' | 'spares' | 'tools' | 'consumables';
  setItemTypeFilter: (val: 'all' | 'spares' | 'tools' | 'consumables') => void;
  stockStatusFilter: 'all' | 'low' | 'warning' | 'safe' | 'out_of_stock';
  setStockStatusFilter: (val: 'all' | 'low' | 'warning' | 'safe' | 'out_of_stock') => void;
  priceRangeFilter: 'all' | 'under1k' | '1k_to_10k' | 'above10k';
  setPriceRangeFilter: (val: 'all' | 'under1k' | '1k_to_10k' | 'above10k') => void;
  sortBy: 'default' | 'qty_asc' | 'qty_desc' | 'price_desc' | 'price_asc' | 'name_asc';
  setSortBy: (val: 'default' | 'qty_asc' | 'qty_desc' | 'price_desc' | 'price_asc' | 'name_asc') => void;
  viewMode: 'table' | 'cards';
  setViewMode: (val: 'table' | 'cards') => void;
  filteredCount: number;
  totalCount: number;
  filteredValue: number;
  filteredLowCount: number;
  onOpenBarcodeScanner: () => void;
  onResetAllFilters: () => void;
}

export function getCategoryIcon(category: string) {
  if (category.includes('هيدروليك')) return <Cog className="w-4 h-4 text-blue-600" />;
  if (category.includes('فلتر') || category.includes('فلاتر')) return <Filter className="w-4 h-4 text-emerald-600" />;
  if (category.includes('زيت') || category.includes('زيوت') || category.includes('شحم') || category.includes('كيميائ')) return <Droplets className="w-4 h-4 text-amber-600" />;
  if (category.includes('حبال') || category.includes('واير') || category.includes('رفع') || category.includes('سلاسل')) return <Anchor className="w-4 h-4 text-cyan-600" />;
  if (category.includes('حساس') || category.includes('إلكترون') || category.includes('كهرب') || category.includes('محرك')) return <Cpu className="w-4 h-4 text-indigo-600" />;
  if (category.includes('عدة') || category.includes('عِدد') || category.includes('أدوات') || category.includes('ورشة') || category.includes('جهاز') || category.includes('مفتاح')) return <Wrench className="w-4 h-4 text-purple-600" />;
  if (category.includes('إطار') || category.includes('جنزير') || category.includes('جنازير') || category.includes('كاوتش')) return <Disc className="w-4 h-4 text-orange-600" />;
  return <Package className="w-4 h-4 text-slate-600" />;
}

export default function InventoryCategoryFilters({
  inventoryItems,
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  selectedWarehouse,
  setSelectedWarehouse,
  itemTypeFilter,
  setItemTypeFilter,
  stockStatusFilter,
  setStockStatusFilter,
  priceRangeFilter,
  setPriceRangeFilter,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  filteredCount,
  totalCount,
  filteredValue,
  filteredLowCount,
  onOpenBarcodeScanner,
  onResetAllFilters
}: CategoryFilterProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Derive unique categories with item counts
  const categoriesList = Array.from(new Set(inventoryItems.map(i => i.category))).filter(Boolean);
  
  // Derive unique warehouses with item counts
  const warehousesList = Array.from(new Set(inventoryItems.map(i => i.warehouseName))).filter(Boolean);

  // Check if any filter is active
  const isAnyFilterActive = search !== '' || 
    selectedCategory !== 'all' || 
    selectedWarehouse !== 'all' || 
    itemTypeFilter !== 'all' || 
    stockStatusFilter !== 'all' || 
    priceRangeFilter !== 'all' ||
    sortBy !== 'default';

  // Count active filters
  let activeFilterCount = 0;
  if (search !== '') activeFilterCount++;
  if (selectedCategory !== 'all') activeFilterCount++;
  if (selectedWarehouse !== 'all') activeFilterCount++;
  if (itemTypeFilter !== 'all') activeFilterCount++;
  if (stockStatusFilter !== 'all') activeFilterCount++;
  if (priceRangeFilter !== 'all') activeFilterCount++;
  if (sortBy !== 'default') activeFilterCount++;

  return (
    <div className="space-y-4">
      {/* 1. Category Quick-Pills Bar (Horizontal Visual Bar) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100/70 text-[#0F4C81] rounded-lg">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">تصنيفات قطع الغيار والأدوات (Categories)</h3>
              <p className="text-[11px] text-slate-500 font-medium">تصفية فورية حسب نوع الصنف والقطع والمستهلكات</p>
            </div>
          </div>

          {/* Quick type toggles */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setItemTypeFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                itemTypeFilter === 'all' ? 'bg-white text-[#0F4C81] shadow-2xs font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              الكل ({inventoryItems.length})
            </button>
            <button
              onClick={() => setItemTypeFilter('spares')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                itemTypeFilter === 'spares' ? 'bg-[#0F4C81] text-white shadow-2xs' : 'hover:text-slate-900'
              }`}
              title="قطع الغيار الميكانيكية، الهيدروليكية، والكهربائية"
            >
              <Cog className="w-3.5 h-3.5" />
              <span>قطع غيار</span>
            </button>
            <button
              onClick={() => setItemTypeFilter('tools')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                itemTypeFilter === 'tools' ? 'bg-purple-700 text-white shadow-2xs' : 'hover:text-slate-900'
              }`}
              title="العِدد، أجهزة الفحص، وأدوات الصيانة"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>عِدد وأدوات</span>
            </button>
            <button
              onClick={() => setItemTypeFilter('consumables')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                itemTypeFilter === 'consumables' ? 'bg-amber-600 text-white shadow-2xs' : 'hover:text-slate-900'
              }`}
              title="الفلاتر، الزيوت، الشحوم، ووايرات الرفع"
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>مستهلكات وزيوت</span>
            </button>
          </div>
        </div>

        {/* Categories Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-[#0F4C81] text-white shadow-sm ring-2 ring-[#0F4C81]/30'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>جميع الفئات</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${selectedCategory === 'all' ? 'bg-white/20' : 'bg-slate-200 text-slate-700 font-extrabold'}`}>
              {inventoryItems.length}
            </span>
          </button>

          {categoriesList.map(cat => {
            const count = inventoryItems.filter(i => i.category === cat).length;
            const isSelected = selectedCategory === cat;
            const lowCountInCat = inventoryItems.filter(i => i.category === cat && i.currentQty <= i.minQty).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-[#0F4C81] text-white border-[#0F4C81] shadow-sm ring-2 ring-[#0F4C81]/30'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {getCategoryIcon(cat)}
                <span>{cat}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700 font-extrabold'
                }`}>
                  {count}
                </span>
                {lowCountInCat > 0 && (
                  <span className={`px-1 py-0.2 rounded-full text-[9px] font-black ${
                    isSelected ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700 border border-rose-200'
                  }`} title={`${lowCountInCat} صنف بحاجة لإعادة طلب`}>
                    !{lowCountInCat}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Search & Filter Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Live Search Input with Barcode Trigger */}
          <div className="relative flex-1 flex items-center">
            <input 
              type="text" 
              placeholder="البحث بالاسم، الكود، الفئة، أو اسم المستودع وموقع التخزين..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-11 pl-32 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] bg-slate-50/50 focus:bg-white transition-all font-medium"
            />
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-28 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                title="مسح البحث"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onOpenBarcodeScanner}
              className="absolute left-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0F4C81] rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-blue-200 cursor-pointer shadow-3xs"
              title="مسح باركود بالكاميرا للبحث السريع وتحديث الرصيد"
            >
              <Scan className="w-3.5 h-3.5 text-blue-600" />
              <span>مسح باركود 📷</span>
            </button>
          </div>

          {/* Storage Warehouse Location Filter */}
          <div className="w-full lg:w-64">
            <div className="relative">
              <Warehouse className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="w-full pr-9 pl-3 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C81] font-bold text-slate-700 appearance-none cursor-pointer"
              >
                <option value="all">📍 جميع مواقع ومستودعات التخزين ({inventoryItems.length})</option>
                {warehousesList.map(wh => {
                  const count = inventoryItems.filter(i => i.warehouseName === wh).length;
                  return (
                    <option key={wh} value={wh}>
                      🏢 {wh} ({count} صنف)
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Sorting Dropdown */}
          <div className="w-full sm:w-48">
            <div className="relative">
              <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="w-full pr-9 pl-3 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C81] font-bold text-slate-700 appearance-none cursor-pointer"
              >
                <option value="default">الترتيب الافتراضي</option>
                <option value="qty_asc">الرصيد: الأقل أولاً (نواقص)</option>
                <option value="qty_desc">الرصيد: الأعلى أولاً</option>
                <option value="price_desc">القيمة: الأعلى سعراً</option>
                <option value="price_asc">القيمة: الأقل سعراً</option>
                <option value="name_asc">الاسم: أ - ي</option>
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Advanced toggle & View switch buttons */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                showAdvancedFilters || priceRangeFilter !== 'all'
                  ? 'bg-blue-50 text-[#0F4C81] border-blue-300 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="فلاتر متقدمة إضافية (نطاق الأسعار، الفرز الدقيق)"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>فلاتر متقدمة</span>
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#0F4C81] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* View Layout Toggle: Table vs Cards */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-[#0F4C81] shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="عرض الجدول التفصيلي"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-[#0F4C81] shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="عرض البطاقات الشبكية (Cards Grid)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Advanced Filter Panel */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50/70 p-3 rounded-xl">
            {/* Price Range Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">تصفية حسب نطاق سعر الوحدة</label>
              <select
                value={priceRangeFilter}
                onChange={(e: any) => setPriceRangeFilter(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-semibold text-slate-700"
              >
                <option value="all">كل الأسعار والقيم</option>
                <option value="under1k">أقل من 1,000 ج.م (اقتصادي)</option>
                <option value="1k_to_10k">من 1,000 إلى 10,000 ج.م (متوسط)</option>
                <option value="above10k">أكثر من 10,000 ج.م (قطع تخصصية عالية القيمة)</option>
              </select>
            </div>

            {/* Warehouse Quick Direct List */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">المستودع الرئيسي / الفرعي</label>
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-semibold text-slate-700"
              >
                <option value="all">كافة المستودعات والمواقع التخزينية</option>
                {warehousesList.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            {/* Category Direct Dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">الفئة المصنفة</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-semibold text-slate-700"
              >
                <option value="all">كافة الفئات والتصنيفات</option>
                {categoriesList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 3. Reorder Level Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 ml-1">حالة الرصيد وحد الطلب:</span>
          
          <button
            onClick={() => setStockStatusFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              stockStatusFilter === 'all'
                ? 'bg-[#0F4C81] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>الجميع</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{inventoryItems.length}</span>
          </button>

          <button
            onClick={() => setStockStatusFilter('low')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              stockStatusFilter === 'low'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>تحت حد الطلب (عاجل)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${stockStatusFilter === 'low' ? 'bg-white/20 text-white' : 'bg-rose-200 text-rose-900 font-black'}`}>
              {inventoryItems.filter(i => i.currentQty <= i.minQty).length}
            </span>
          </button>

          <button
            onClick={() => setStockStatusFilter('warning')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              stockStatusFilter === 'warning'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            <span>اقتربت من حد الطلب</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${stockStatusFilter === 'warning' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900 font-black'}`}>
              {inventoryItems.filter(i => i.currentQty > i.minQty && i.currentQty <= i.minQty * 1.5).length}
            </span>
          </button>

          <button
            onClick={() => setStockStatusFilter('safe')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              stockStatusFilter === 'safe'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>رصيد آمن ومطابق</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${stockStatusFilter === 'safe' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900 font-black'}`}>
              {inventoryItems.filter(i => i.currentQty > i.minQty * 1.5).length}
            </span>
          </button>

          <button
            onClick={() => setStockStatusFilter('out_of_stock')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              stockStatusFilter === 'out_of_stock'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
            <span>أصناف نافدة (رصيد صفر)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${stockStatusFilter === 'out_of_stock' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800 font-black'}`}>
              {inventoryItems.filter(i => i.currentQty === 0).length}
            </span>
          </button>
        </div>
      </div>

      {/* 4. Active Filters Bar & Summary Metrics */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/80 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500 font-bold">النتائج المعروضة:</span>
          <span className="px-2 py-0.5 bg-blue-100 text-[#0F4C81] rounded-md font-extrabold">
            {filteredCount} من إجمالي {totalCount} صنف
          </span>

          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-[#0F4C81] rounded-md font-bold">
              <span>الفئة: {selectedCategory}</span>
              <button onClick={() => setSelectedCategory('all')} className="hover:text-rose-600">×</button>
            </span>
          )}

          {selectedWarehouse !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-md font-bold">
              <span>المستودع: {selectedWarehouse}</span>
              <button onClick={() => setSelectedWarehouse('all')} className="hover:text-rose-600">×</button>
            </span>
          )}

          {itemTypeFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-50 border border-purple-200 text-purple-800 rounded-md font-bold">
              <span>النوع: {itemTypeFilter === 'spares' ? 'قطع غيار' : itemTypeFilter === 'tools' ? 'عِدد وأدوات' : 'مستهلكات وزيوت'}</span>
              <button onClick={() => setItemTypeFilter('all')} className="hover:text-rose-600">×</button>
            </span>
          )}

          {stockStatusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-md font-bold">
              <span>حالة الرصيد: {stockStatusFilter === 'low' ? 'تحت حد الطلب' : stockStatusFilter === 'warning' ? 'اقترب من الحد' : stockStatusFilter === 'safe' ? 'آمن' : 'نافد'}</span>
              <button onClick={() => setStockStatusFilter('all')} className="hover:text-rose-600">×</button>
            </span>
          )}

          {priceRangeFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md font-bold">
              <span>نطاق السعر: {priceRangeFilter === 'under1k' ? '< 1,000 ج.م' : priceRangeFilter === '1k_to_10k' ? '1,000 - 10,000 ج.م' : '> 10,000 ج.م'}</span>
              <button onClick={() => setPriceRangeFilter('all')} className="hover:text-rose-600">×</button>
            </span>
          )}

          {isAnyFilterActive && (
            <button
              onClick={onResetAllFilters}
              className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="إلغاء وتفريغ كافة معايير الفلترة والبحث"
            >
              <RotateCcw className="w-3 h-3" />
              <span>إعادة تعيين الفلاتر (مسح الكل)</span>
            </button>
          )}
        </div>

        {/* Filtered KPI Summary */}
        <div className="flex items-center gap-3 font-medium text-xs">
          <span>إجمالي القيمة: <strong className="text-[#0F4C81] font-extrabold">{filteredValue.toLocaleString()} ج.م</strong></span>
          {filteredLowCount > 0 && (
            <span className="text-rose-600 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{filteredLowCount} صنف بحاجة لتوريد</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
