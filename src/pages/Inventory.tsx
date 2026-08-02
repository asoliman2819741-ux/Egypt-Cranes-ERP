import React, { useState } from 'react';
import { InventoryItem, CostCenter } from '../types';
import { initialInventoryItems } from '../mockData';
import { 
  Plus, Search, Archive, PackageCheck, AlertTriangle, ArrowUpRight, 
  ArrowDownRight, Warehouse, FileSpreadsheet, UploadCloud, X, 
  CheckCircle2, AlertCircle, Database, Download, BarChart2 
} from 'lucide-react';
import InventoryAnalyticsDashboard from '../components/InventoryAnalyticsDashboard';
import ExportPDFButton from '../components/ExportPDFButton';

interface InventoryProps {
  inventoryItems: InventoryItem[];
  costCenters: CostCenter[];
  onAddInventoryItem: (newItem: InventoryItem) => void;
  onAddInventoryItems: (newItems: InventoryItem[]) => void;
  onUpdateInventoryQty: (itemId: string, newQty: number) => void;
}

export default function Inventory({ inventoryItems, costCenters, onAddInventoryItem, onAddInventoryItems, onUpdateInventoryQty }: InventoryProps) {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'items' | 'receipt' | 'issue' | 'analytics'>('analytics');

  // States for CSV/Excel bulk import
  const [showImportModal, setShowImportModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Column Map & Preview, 3: Finish
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fileRows, setFileRows] = useState<any[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    code: 'كود الصنف',
    nameAr: 'اسم الصنف',
    category: 'الفئة',
    unit: 'الوحدة',
    currentQty: 'الكمية الحالية',
    minQty: 'الحد الأدنى',
    unitPrice: 'سعر الوحدة',
    warehouseName: 'المستودع'
  });

  const parseCSVText = (text: string) => {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length === 0) return;

    let sep = ',';
    const firstLine = lines[0];
    if (firstLine.includes(';')) sep = ';';
    else if (firstLine.includes('\t')) sep = '\t';

    const parseLine = (line: string) => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === sep && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map(parseLine);

    setFileHeaders(headers);
    setFileRows(rows);

    const newMapping = { ...columnMapping };
    const dbFields = [
      { key: 'code', ar: ['كود الصنف', 'كود', 'كود_الصنف', 'code'] },
      { key: 'nameAr', ar: ['اسم الصنف', 'اسم', 'الاسم', 'name', 'nameAr'] },
      { key: 'category', ar: ['الفئة', 'فئة', 'التصنيف', 'category'] },
      { key: 'unit', ar: ['الوحدة', 'وحدة القياس', 'وحدة', 'unit'] },
      { key: 'currentQty', ar: ['الكمية الحالية', 'الكمية', 'رصيد', 'currentQty', 'qty'] },
      { key: 'minQty', ar: ['الحد الأدنى', 'الحد', 'حد الطلب', 'minQty'] },
      { key: 'unitPrice', ar: ['سعر الوحدة', 'السعر', 'سعر', 'unitPrice', 'price'] },
      { key: 'warehouseName', ar: ['الموقع المستودعي', 'المستودع', 'المخزن', 'warehouseName', 'warehouse'] },
    ];

    dbFields.forEach(field => {
      const match = headers.find(h => 
        field.ar.some(keyword => h.toLowerCase().includes(keyword.toLowerCase()))
      );
      if (match) {
        newMapping[field.key] = match;
      } else {
        const exactMatch = headers.find(h => h.trim() === field.ar[0]);
        if (exactMatch) {
          newMapping[field.key] = exactMatch;
        }
      }
    });

    setColumnMapping(newMapping);
    setImportStep(2);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSVText(text);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setImportFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseCSVText(text);
      };
      reader.readAsText(file);
    }
  };

  const loadMockImportData = () => {
    const mockHeaders = ['كود الصنف', 'اسم الصنف', 'الفئة', 'الوحدة', 'الكمية الحالية', 'الحد الأدنى', 'سعر الوحدة', 'المستودع'];
    const mockRows = [
      ['EC-INV-990', 'فلتر زيت ديزل كوماتسو 320', 'قطع غيار هيدروليكية', 'قطعة', '45', '10', '1500', 'المخزن الرئيسي - الجيزة ورشة'],
      ['EC-INV-991', 'طقم جوانات هيدروليك بوم تلسكوبي', 'قطع غيار هيدروليكية', 'طقم', '12', '5', '3400', 'المخزن الرئيسي - الجيزة ورشة'],
      ['EC-INV-992', 'زيت هيدروليك موبيل تيتان 46', 'زيوت وشحومات', 'برميل', '18', '4', '8500', 'مخزن الزيوت والمستهلكات السريعة'],
      ['EC-INV-993', 'واير صلب كوري عالي التحمل 22 ملم', 'وايرات وسلاسل', 'متر', '150', '50', '280', 'المخزن الرئيسي - الجيزة ورشة'],
      ['EC-INV-994', 'طقم كشافات هالوجين إنارة تلسكوبية', 'كهربائيات وإضاءة', 'قطعة', '8', '10', '950', 'مخزن المستلزمات والقطع الدقيقة'],
    ];
    setFileHeaders(mockHeaders);
    setFileRows(mockRows);
    setImportStep(2);
    setImportFile({ name: 'egypt_cranes_mock_template.xlsx' } as any);
  };

  const importedItems = React.useMemo(() => {
    if (importStep !== 2) return [];
    
    return fileRows.map((row, rowIndex) => {
      const getVal = (key: string) => {
        const headerName = columnMapping[key];
        const headerIdx = fileHeaders.indexOf(headerName);
        return headerIdx !== -1 ? row[headerIdx] : '';
      };

      const codeVal = getVal('code') || `EC-INV-GEN-${rowIndex + 100}`;
      const nameArVal = getVal('nameAr') || '';
      const categoryVal = getVal('category') || 'قطع غيار هيدروليكية';
      const unitVal = getVal('unit') || 'قطعة';
      const currentQtyVal = parseFloat(getVal('currentQty')) || 0;
      const minQtyVal = parseFloat(getVal('minQty')) || 0;
      const unitPriceVal = parseFloat(getVal('unitPrice')) || 0;
      const warehouseVal = getVal('warehouseName') || 'المخزن الرئيسي - الجيزة ورشة';

      const errors: string[] = [];
      if (!nameArVal) {
        errors.push('اسم الصنف مطلوب');
      }
      if (inventoryItems.some(item => item.code.toLowerCase() === codeVal.toLowerCase())) {
        errors.push(`كود الصنف مكرر (${codeVal})`);
      }

      return {
        item: {
          id: Math.random().toString(),
          code: codeVal,
          nameAr: nameArVal,
          category: categoryVal,
          unit: unitVal,
          currentQty: currentQtyVal,
          minQty: minQtyVal,
          unitPrice: unitPriceVal,
          warehouseName: warehouseVal
        } as InventoryItem,
        errors,
        isValid: errors.length === 0
      };
    });
  }, [fileRows, fileHeaders, columnMapping, importStep, inventoryItems]);

  const handleConfirmImport = () => {
    const validItems = importedItems.filter(item => item.isValid).map(item => item.item);
    if (validItems.length === 0) {
      alert('لا توجد بيانات صالحة للاستيراد!');
      return;
    }

    onAddInventoryItems(validItems);
    alert(`تم بنجاح استيراد عدد (${validItems.length}) صنف جديد إلى المخازن!`);
    setShowImportModal(false);
    setImportFile(null);
    setFileHeaders([]);
    setFileRows([]);
    setImportStep(1);
  };

  // New Item states
  const [code, setCode] = useState(`EC-INV-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`);
  const [nameAr, setNameAr] = useState('');
  const [category, setCategory] = useState('قطع غيار هيدروليكية');
  const [unit, setUnit] = useState('قطعة');
  const [qty, setQty] = useState('');
  const [minQty, setMinQty] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [warehouse, setWarehouse] = useState('المخزن الرئيسي - الجيزة ورشة');

  // Simple quick transaction states
  const [txItemId, setTxItemId] = useState('');
  const [txQty, setTxQty] = useState('');
  const [txCCId, setTxCCId] = useState('');
  const [txNotes, setTxNotes] = useState('');

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: InventoryItem = {
      id: Math.random().toString(),
      code,
      nameAr,
      category,
      unit,
      currentQty: parseFloat(qty) || 0,
      minQty: parseFloat(minQty) || 0,
      unitPrice: parseFloat(unitPrice) || 0,
      warehouseName: warehouse
    };

    onAddInventoryItem(newItem);
    setShowAddForm(false);
    // Reset Form
    setCode(`EC-INV-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`);
    setNameAr('');
    setQty('');
    setMinQty('');
    setUnitPrice('');
  };

  const handleTx = (type: 'in' | 'out') => {
    const item = inventoryItems.find(i => i.id === txItemId);
    if (!item) {
      alert('يرجى اختيار الصنف');
      return;
    }
    const val = parseFloat(txQty) || 0;
    if (val <= 0) {
      alert('يرجى إدخال كمية صحيحة');
      return;
    }

    if (type === 'out' && val > item.currentQty) {
      alert('الكمية المطلوبة تتجاوز الرصيد المتاح بالمخزن!');
      return;
    }

    if (type === 'out' && !txCCId) {
      alert('يرجى تحديد مركز التكلفة المقيد عليه الصرف');
      return;
    }

    const multiplier = type === 'in' ? 1 : -1;
    onUpdateInventoryQty(item.id, item.currentQty + (val * multiplier));
    alert(`تم تسجيل مستند المخازن بنجاح! الرصيد الجديد: ${item.currentQty + (val * multiplier)} ${item.unit}`);
    
    // Clear
    setTxItemId('');
    setTxQty('');
    setTxCCId('');
    setTxNotes('');
  };

  const filtered = inventoryItems.filter(item => 
    item.nameAr.toLowerCase().includes(search.toLowerCase()) ||
    item.code.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockItems = inventoryItems.filter(i => i.currentQty <= i.minQty);
  const totalVal = inventoryItems.reduce((sum, i) => sum + (i.currentQty * i.unitPrice), 0);

  return (
    <div className="p-6 space-y-6 dir-rtl text-right font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">مخازن قطع الغيار والمستهلكات (Inventory)</h1>
          <p className="text-slate-500 mt-1 text-sm">متابعة أرصدة قطع الغيار والوايرات والزيوت والتكامل المباشر مع مراكز التكلفة</p>
        </div>
        <div className="flex flex-wrap gap-2 self-start">
          <button 
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md"
          >
            <FileSpreadsheet className="w-5 h-5" /> استيراد الأصناف جماعياً (CSV/Excel)
          </button>
          <button 
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2.5 bg-[#0F4C81] text-white font-bold text-sm rounded-xl hover:bg-[#0c3d67] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" /> تسجيل صنف جديد في الكتالوج
          </button>
        </div>
      </div>

      {/* Sub-tabs inside Inventory Dashboard */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`px-5 py-2.5 text-sm font-extrabold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'analytics' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>لوحة التحليلات وإعادة الطلب (Reorder Points & Analytics) 📊</span>
        </button>
        <button 
          onClick={() => setActiveTab('items')}
          className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'items' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          أرصدة الأصناف والكتالوج
        </button>
        <button 
          onClick={() => setActiveTab('receipt')}
          className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'receipt' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          سند إضافة وارد للمخازن
        </button>
        <button 
          onClick={() => setActiveTab('issue')}
          className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'issue' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          سند صرف منصرف للمشاريع
        </button>
      </div>

      {activeTab === 'analytics' && (
        <InventoryAnalyticsDashboard 
          inventoryItems={inventoryItems}
          costCenters={costCenters}
          onQuickReorderRequest={(itemId, requestedQty) => {
            const item = inventoryItems.find(i => i.id === itemId);
            if (item) {
              alert(`تم تسجيل طلب شراء توريد عاجل للصنف (${item.nameAr}) بكمية (${requestedQty} ${item.unit}) وتحويله لقسم المشتريات والعقود!`);
            }
          }}
        />
      )}

      {activeTab === 'items' && (
        <div className="space-y-6">
          {/* Quick Metrics Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">إجمالي قيمة المخزون</span>
                <p className="text-xl font-black text-[#0F4C81]">{totalVal.toLocaleString()} ج.م</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0F4C81] flex items-center justify-center">
                <Archive className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">المخزون المغطى والأصناف</span>
                <p className="text-xl font-black text-emerald-600">{inventoryItems.length} صنف مسجل</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <PackageCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">أصناف تحت حد الطلب</span>
                <p className="text-xl font-black text-rose-600">{lowStockItems.length} أصناف منخفضة</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Low Stock Warners */}
          {lowStockItems.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
                <span>تحذير: توجد أصناف وصلت للحد الأدنى للمخزون أو نفذت! يرجى إصدار أمر شراء توريد فوري:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {lowStockItems.map(item => (
                  <div key={item.id} className="p-3 bg-white rounded-xl border border-amber-100 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800 block">{item.nameAr}</span>
                      <span className="text-slate-400">رصيد: {item.currentQty} {item.unit} • الحد: {item.minQty}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded-full font-bold">حرج</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search tool & Export PDF Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:flex-1">
              <input 
                type="text" 
                placeholder="البحث بالاسم أو الرمز المرجعي بالمخزن..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-11 pl-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>

            <ExportPDFButton
              variant="primary"
              titleAr="تصدير تقرير المخزون PDF 📄"
              titleEn="Export Inventory PDF Report 📄"
              exportOptions={{
                titleAr: 'تقرير تقييم حركة المخزون ورصيد قطع الغيار',
                titleEn: 'Spare Parts Inventory & Stock Balance Report',
                filename: 'inventory_spare_parts_report',
                columns: [
                  { headerAr: 'كود الصنف', accessor: 'code', align: 'right' },
                  { headerAr: 'اسم الصنف والكتالوج', accessor: 'nameAr', align: 'right' },
                  { headerAr: 'الفئة', accessor: 'category', align: 'right' },
                  { headerAr: 'الموقع المستودعي', accessor: 'warehouseName', align: 'right' },
                  { headerAr: 'الرصيد المتاح', accessor: (row) => `${row.currentQty} ${row.unit}`, align: 'right' },
                  { headerAr: 'سعر الوحدة', accessor: (row) => `${row.unitPrice.toLocaleString()} ج.م`, align: 'right' },
                  { headerAr: 'القيمة الإجمالية', accessor: (row) => `${(row.currentQty * row.unitPrice).toLocaleString()} ج.م`, align: 'right' }
                ],
                data: filtered,
                summaryItems: [
                  { labelAr: 'إجمالي قيمة المخزون', value: `${totalVal.toLocaleString()} ج.م`, highlight: true },
                  { labelAr: 'عدد الأصناف المعروضة', value: `${filtered.length} صنف` },
                  { labelAr: 'أصناف حرجة مخفضة', value: `${lowStockItems.length} أصناف` }
                ]
              }}
            />
          </div>

          {/* Table list */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 font-bold text-slate-700">كود الصنف</th>
                    <th className="px-6 py-4 font-bold text-slate-700">الصنف والكتالوج</th>
                    <th className="px-6 py-4 font-bold text-slate-700">الفئة</th>
                    <th className="px-6 py-4 font-bold text-slate-700">الموقع المستودعي</th>
                    <th className="px-6 py-4 font-bold text-slate-700">الرصيد المتاح</th>
                    <th className="px-6 py-4 font-bold text-slate-700">سعر الوحدة</th>
                    <th className="px-6 py-4 font-bold text-slate-700">القيمة الإجمالية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(item => {
                    const isLow = item.currentQty <= item.minQty;
                    return (
                      <tr key={item.id} className={`hover:bg-slate-50/30 transition-colors ${isLow ? 'bg-amber-50/20' : ''}`}>
                        <td className="px-6 py-4 font-mono font-bold text-slate-600">{item.code}</td>
                        <td className="px-6 py-4">
                          <div>
                            <span className="font-bold text-slate-800 block">{item.nameAr}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">وحدة القياس: {item.unit}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">{item.category}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.warehouseName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-black text-sm ${isLow ? 'text-red-600' : 'text-slate-800'}`}>
                            {item.currentQty} {item.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{item.unitPrice.toLocaleString()} ج.م</td>
                        <td className="px-6 py-4 font-extrabold text-[#0F4C81]">{(item.currentQty * item.unitPrice).toLocaleString()} ج.م</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Goods Receipt / Issue forms */}
      {(activeTab === 'receipt' || activeTab === 'issue') && (
        <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              activeTab === 'receipt' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {activeTab === 'receipt' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800">
                {activeTab === 'receipt' ? 'تسجيل وارد مخازن (إضافة رصيد)' : 'تسجيل منصرف مخازن (صرف للمشروع)'}
              </h3>
              <p className="text-xs text-slate-400">إجراء حركات الأرصيد اليدوية مع الفحص</p>
            </div>
          </div>

          <div className="space-y-4 text-xs font-semibold text-slate-700">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">اختر صنف مخازن</label>
              <select 
                value={txItemId} 
                onChange={(e) => setTxItemId(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
              >
                <option value="">-- اختر صنف --</option>
                {inventoryItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.nameAr} (متاح: {item.currentQty} {item.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">الكمية المطلوبة</label>
              <input 
                type="number" 
                placeholder="أدخل كمية الحركة..."
                value={txQty}
                onChange={(e) => setTxQty(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            {activeTab === 'issue' && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">تحديد مركز التكلفة المستفيد (قيد الصرف)</label>
                <select 
                  value={txCCId} 
                  onChange={(e) => setTxCCId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                >
                  <option value="">-- اختر مركز تكلفة --</option>
                  {costCenters.map(cc => (
                    <option key={cc.id} value={cc.id}>{cc.nameAr}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">البيان وملاحظات الحركة</label>
              <textarea 
                placeholder="أدخل سبب الحركة أو رقم مستند الشراء اليدوي..."
                value={txNotes}
                onChange={(e) => setTxNotes(e.target.value)}
                rows={2}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs resize-none"
              />
            </div>

            <button
              type="button"
              onClick={() => handleTx(activeTab === 'receipt' ? 'in' : 'out')}
              className={`w-full py-3 rounded-xl font-bold text-white text-xs transition-colors shadow-md ${
                activeTab === 'receipt' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {activeTab === 'receipt' ? 'تسجيل وارد المخزن' : 'حفظ سند صرف البند'}
            </button>
          </div>
        </div>
      )}

      {/* Add Item Catalog Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-100 overflow-hidden text-right">
            <div className="bg-[#0F4C81] p-6 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg">تعريف صنف مخازن جديد</h3>
              <button onClick={() => setShowAddForm(false)} className="text-white hover:bg-white/10 rounded-lg p-1">×</button>
            </div>
            
            <form onSubmit={handleCreateItem} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">كود الصنف الفرعي</label>
                  <input 
                    type="text" 
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">الفئة التصنيفية</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] bg-white"
                  >
                    <option value="قطع غيار هيدروليكية">قطع غيار هيدروليكية</option>
                    <option value="فلاتر ومستهلكات">فلاتر ومستهلكات</option>
                    <option value="زيوت ومواد كيميائية">زيوت ومواد كيميائية</option>
                    <option value="حبال وأسلاك الرفع">حبال وأسلاك الرفع</option>
                    <option value="حساسات وأجهزة إلكترونية">حساسات وأجهزة إلكترونية</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">اسم الصنف بالكامل</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: طرمبة زيت رئيسية ديمباج ٢٥٠ طن"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">وحدة القياس</label>
                  <input 
                    type="text" 
                    required
                    placeholder="قطعة/متر/برميل"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">الرصيد الافتتاحي</label>
                  <input 
                    type="number" 
                    required
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">الحد الأدنى</label>
                  <input 
                    type="number" 
                    required
                    value={minQty}
                    onChange={(e) => setMinQty(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">سعر الوحدة (ج.م)</label>
                  <input 
                    type="number" 
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">المستودع الرئيسي لحفظه</label>
                  <select 
                    value={warehouse}
                    onChange={(e) => setWarehouse(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] bg-white"
                  >
                    <option value="المخزن الرئيسي - الجيزة ورشة">المخزن الرئيسي - الجيزة ورشة</option>
                    <option value="مخزن الزيوت والمستهلكات السريعة">مخزن الزيوت والمستهلكات السريعة</option>
                    <option value="مخزن المستلزمات والقطع الدقيقة">مخزن المستلزمات والقطع الدقيقة</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button 
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#0F4C81] text-white text-sm font-bold rounded-xl hover:bg-[#0c3d67] transition-colors"
                >
                  حفظ الصنف بالكتالوج
                </button>
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📥 نافذة استيراد الأصناف جماعياً Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col font-sans text-right dir-rtl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-3xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">معالج استيراد الأصناف جماعياً (CSV / Excel)</h3>
                  <p className="text-[11px] text-slate-400 font-bold">قم برفع ملف الأرصدة والكتالوجات لتحديث قائمة الأصناف والكميات فورياً</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setFileHeaders([]);
                  setFileRows([]);
                  setImportStep(1);
                }}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Wizard Header */}
            <div className="flex border-b border-slate-100 bg-slate-50/20 px-5 py-3 text-xs font-bold text-slate-500 justify-start gap-8">
              <div className={`flex items-center gap-2 ${importStep === 1 ? 'text-[#0F4C81]' : ''}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${importStep === 1 ? 'bg-[#0F4C81] text-white' : 'bg-slate-200 text-slate-600'}`}>١</span>
                <span>رفع الملف (.csv / .xlsx)</span>
              </div>
              <div className={`flex items-center gap-2 ${importStep === 2 ? 'text-[#0F4C81]' : ''}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${importStep === 2 ? 'bg-[#0F4C81] text-white' : 'bg-slate-200 text-slate-600'}`}>٢</span>
                <span>مطابقة الحقول والمعاينة</span>
              </div>
              <div className={`flex items-center gap-2 ${importStep === 3 ? 'text-[#0F4C81]' : ''}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${importStep === 3 ? 'bg-[#0F4C81] text-white' : 'bg-slate-200 text-slate-600'}`}>٣</span>
                <span>حفظ البيانات واكتمال الاستيراد</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {importStep === 1 && (
                <div className="space-y-6">
                  {/* Instructions banner */}
                  <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl space-y-2 text-xs">
                    <span className="font-extrabold text-[#0F4C81] block">💡 إرشادات هامة لتنسيق الملف:</span>
                    <p className="text-slate-600 leading-relaxed font-semibold">
                      يفضل أن يحتوي الملف على رأس للأعمدة (Header Row) لتسهيل مطابقة البيانات. الحقول المدعومة للاستيراد تشمل:
                      <span className="text-[#0F4C81] font-mono mx-1">كود الصنف*</span>،
                      <span className="text-[#0F4C81] font-mono mx-1">اسم الصنف*</span>،
                      <span className="text-[#0F4C81] font-mono mx-1">الفئة</span>،
                      <span className="text-[#0F4C81] font-mono mx-1">الوحدة</span>،
                      <span className="text-[#0F4C81] font-mono mx-1">الكمية الحالية</span>،
                      <span className="text-[#0F4C81] font-mono mx-1">الحد الأدنى</span>،
                      <span className="text-[#0F4C81] font-mono mx-1">سعر الوحدة</span>.
                    </p>
                  </div>

                  {/* Drag-drop Zone */}
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                      dragActive ? 'border-[#0F4C81] bg-blue-50/20' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input 
                      type="file" 
                      id="inventory-import-file" 
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden" 
                    />
                    <label 
                      htmlFor="inventory-import-file" 
                      className="cursor-pointer flex flex-col items-center gap-3"
                    >
                      <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 shadow-3xs">
                        <UploadCloud className="w-7 h-7" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-slate-700 block">اسحب وأفلت الملف هنا أو انقر للتصفح</span>
                        <span className="text-[11px] text-slate-400 font-bold mt-1 block">الملفات المدعومة: CSV, Microsoft Excel (.xlsx, .xls)</span>
                      </div>
                    </label>
                  </div>

                  {/* Load instant demo data button */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 border rounded-2xl">
                    <div>
                      <span className="text-xs font-black text-slate-700 block">هل تود اختبار المعالج سريعاً؟</span>
                      <span className="text-[10px] text-slate-400 font-bold">اضغط على الزر الجانبي لتحميل هيكل بيانات مخازن افتراضي بشكل فوري لتجربة الاستيراد.</span>
                    </div>
                    <button 
                      onClick={loadMockImportData}
                      className="px-4 py-2 bg-[#0F4C81]/10 hover:bg-[#0F4C81]/20 text-[#0F4C81] text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Database className="w-4 h-4 text-[#F7941D]" />
                      <span>تحميل بيانات تجريبية فوراً</span>
                    </button>
                  </div>
                </div>
              )}

              {importStep === 2 && (
                <div className="space-y-6">
                  {/* File Info */}
                  <div className="p-3.5 bg-slate-50 border rounded-xl flex items-center justify-between text-xs font-bold text-slate-600">
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>الملف النشط: {importFile?.name}</span>
                    </span>
                    <span className="bg-slate-200 px-2 py-0.5 rounded text-[10px] font-black text-slate-600">
                      تم العثور على {fileRows.length} صفوف و {fileHeaders.length} أعمدة
                    </span>
                  </div>

                  {/* Column Mapping Section */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-800 border-r-2 border-[#0F4C81] pr-2.5">مطابقة أعمدة الملف مع حقول النظام (Column Mapping)</h4>
                    <p className="text-[11px] text-slate-400 font-bold">حدد اسم العمود المقابل لكل حقل في النظام من القوائم أدناه لضمان الاستيراد الدقيق:</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 border rounded-xl text-xs">
                      {Object.keys(columnMapping).map((key) => {
                        const dbFieldLabels: Record<string, string> = {
                          code: 'كود الصنف (*)',
                          nameAr: 'اسم الصنف (*)',
                          category: 'الفئة والتصنيف',
                          unit: 'وحدة القياس',
                          currentQty: 'الكمية الحالية',
                          minQty: 'حد الطلب الأدنى',
                          unitPrice: 'سعر الوحدة ج.م',
                          warehouseName: 'الموقع المستودعي'
                        };

                        return (
                          <div key={key} className="space-y-1.5">
                            <label className="block text-slate-600 font-bold">{dbFieldLabels[key]}</label>
                            <select 
                              value={columnMapping[key]} 
                              onChange={(e) => setColumnMapping({
                                ...columnMapping,
                                [key]: e.target.value
                              })}
                              className="w-full p-2 border border-slate-200 rounded-lg bg-white text-[11px] font-semibold text-slate-700"
                            >
                              <option value="">-- غير محدد --</option>
                              {fileHeaders.map(header => (
                                <option key={header} value={header}>{header}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Table Preview */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-800 border-r-2 border-emerald-600 pr-2.5">معاينة البيانات والتحقق من صحتها (Validation Preview)</h4>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        الأصناف الصالحة للاستيراد: {importedItems.filter(i => i.isValid).length} من {importedItems.length}
                      </span>
                    </div>

                    <div className="border rounded-xl overflow-hidden shadow-xs">
                      <div className="overflow-x-auto max-h-[240px]">
                        <table className="w-full text-right border-collapse text-[11px] text-slate-600">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold sticky top-0">
                              <th className="py-2.5 px-3">الحالة</th>
                              <th className="py-2.5 px-3">كود الصنف</th>
                              <th className="py-2.5 px-3">اسم الصنف</th>
                              <th className="py-2.5 px-3">الفئة</th>
                              <th className="py-2.5 px-3">الكمية</th>
                              <th className="py-2.5 px-3">سعر الوحدة</th>
                              <th className="py-2.5 px-3">المستودع</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {importedItems.map((row, idx) => (
                              <tr key={idx} className={row.isValid ? 'hover:bg-slate-50/50' : 'bg-red-50/20 hover:bg-red-50/40'}>
                                <td className="py-2 px-3 font-bold">
                                  {row.isValid ? (
                                    <span className="flex items-center gap-1 text-emerald-600">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>سليم</span>
                                    </span>
                                  ) : (
                                    <span className="flex flex-col gap-0.5 text-rose-600 font-bold" title={row.errors.join(', ')}>
                                      <span className="flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span>خطأ</span>
                                      </span>
                                      <span className="text-[9px] text-rose-500 max-w-[120px] truncate">{row.errors[0]}</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 font-mono font-bold">{row.item.code}</td>
                                <td className="py-2 px-3 font-bold text-slate-800">{row.item.nameAr || <span className="text-rose-400">فارغ *</span>}</td>
                                <td className="py-2 px-3 text-slate-400">{row.item.category}</td>
                                <td className="py-2 px-3 font-mono font-bold text-slate-700">{row.item.currentQty} {row.item.unit}</td>
                                <td className="py-2 px-3 font-mono text-[#0F4C81]">{row.item.unitPrice.toLocaleString()} ج.م</td>
                                <td className="py-2 px-3 text-slate-500">{row.item.warehouseName}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between gap-3">
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setFileHeaders([]);
                  setFileRows([]);
                  setImportStep(1);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black rounded-xl transition-all cursor-pointer"
              >
                إلغاء المعالج
              </button>

              <div className="flex gap-2">
                {importStep === 2 && (
                  <button 
                    onClick={() => {
                      setImportStep(1);
                      setImportFile(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all border cursor-pointer"
                  >
                    السابق (تغيير الملف)
                  </button>
                )}

                {importStep === 2 ? (
                  <button 
                    onClick={handleConfirmImport}
                    disabled={importedItems.filter(i => i.isValid).length === 0}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-900/10"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد استيراد ({importedItems.filter(i => i.isValid).length}) صنف</span>
                  </button>
                ) : (
                  <button 
                    disabled={importStep === 1 && !importFile}
                    onClick={() => setImportStep(2)}
                    className="px-5 py-2 bg-[#0F4C81] hover:bg-[#0c3d67] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>المتابعة للمطابقة والمعاينة</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
