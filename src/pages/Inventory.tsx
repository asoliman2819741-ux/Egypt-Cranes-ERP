import React, { useState } from 'react';
import { InventoryItem, CostCenter } from '../types';
import { initialInventoryItems } from '../mockData';
import { 
  Plus, Search, Archive, PackageCheck, AlertTriangle, ArrowUpRight, 
  ArrowDownRight, Warehouse, FileSpreadsheet, UploadCloud, X, 
  CheckCircle2, AlertCircle, Database, Download, BarChart2, ShieldAlert,
  Bell, BellRing, Filter, ShoppingCart, Check, RefreshCw, Layers,
  Camera, Scan, Tag, QrCode
} from 'lucide-react';
import InventoryAnalyticsDashboard from '../components/InventoryAnalyticsDashboard';
import ExportPDFButton from '../components/ExportPDFButton';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import InventoryCategoryFilters, { getCategoryIcon } from '../components/InventoryCategoryFilters';

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
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

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

  // Status, Category, Warehouse, Type & Price filters
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'warning' | 'safe' | 'out_of_stock'>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>('all');
  const [itemTypeFilter, setItemTypeFilter] = useState<'all' | 'spares' | 'tools' | 'consumables'>('all');
  const [priceRangeFilter, setPriceRangeFilter] = useState<'all' | 'under1k' | '1k_to_10k' | 'above10k'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'qty_asc' | 'qty_desc' | 'price_desc' | 'price_asc' | 'name_asc'>('default');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [reorderNotificationToast, setReorderNotificationToast] = useState<{ show: boolean; msg: string; itemName?: string } | null>(null);

  // Reorder Level calculations
  const lowStockItems = inventoryItems.filter(i => i.currentQty <= i.minQty);
  const nearReorderItems = inventoryItems.filter(i => i.currentQty > i.minQty && i.currentQty <= i.minQty * 1.5);
  const safeStockItems = inventoryItems.filter(i => i.currentQty > i.minQty * 1.5);

  const categories = Array.from(new Set(inventoryItems.map(i => i.category))).filter(Boolean);
  const warehouses = Array.from(new Set(inventoryItems.map(i => i.warehouseName))).filter(Boolean);

  const filtered = inventoryItems
    .filter(item => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || 
                            item.nameAr.toLowerCase().includes(q) ||
                            item.code.toLowerCase().includes(q) ||
                            item.category.toLowerCase().includes(q) ||
                            item.warehouseName.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      // Category filter
      if (selectedCategoryFilter !== 'all' && item.category !== selectedCategoryFilter) return false;

      // Warehouse / Location filter
      if (selectedWarehouseFilter !== 'all' && item.warehouseName !== selectedWarehouseFilter) return false;

      // Item Type classification (Spares / Tools / Consumables)
      if (itemTypeFilter === 'spares') {
        const isSpare = item.category.includes('هيدروليك') || 
                        item.category.includes('حساس') || 
                        item.category.includes('إلكترون') || 
                        item.category.includes('كهرب') || 
                        item.category.includes('محرك') || 
                        item.category.includes('إطار') || 
                        item.category.includes('جنزير') ||
                        item.category.includes('قطع');
        if (!isSpare) return false;
      } else if (itemTypeFilter === 'tools') {
        const isTool = item.category.includes('عدة') || 
                       item.category.includes('عِدد') || 
                       item.category.includes('أدوات') || 
                       item.category.includes('ورشة') || 
                       item.nameAr.includes('مفتاح') || 
                       item.nameAr.includes('جهاز') ||
                       item.nameAr.includes('طقم');
        if (!isTool) return false;
      } else if (itemTypeFilter === 'consumables') {
        const isConsumable = item.category.includes('فلتر') || 
                             item.category.includes('فلاتر') || 
                             item.category.includes('زيت') || 
                             item.category.includes('زيوت') || 
                             item.category.includes('شحم') || 
                             item.category.includes('حبال') || 
                             item.category.includes('واير') || 
                             item.category.includes('مستهلك');
        if (!isConsumable) return false;
      }

      // Stock Status filter
      const isLow = item.currentQty <= item.minQty;
      const isNear = item.currentQty > item.minQty && item.currentQty <= item.minQty * 1.5;
      const isSafe = item.currentQty > item.minQty * 1.5;
      const isOutOfStock = item.currentQty === 0;

      if (stockStatusFilter === 'low' && !isLow) return false;
      if (stockStatusFilter === 'warning' && !isNear) return false;
      if (stockStatusFilter === 'safe' && !isSafe) return false;
      if (stockStatusFilter === 'out_of_stock' && !isOutOfStock) return false;

      // Price range filter
      if (priceRangeFilter === 'under1k' && item.unitPrice >= 1000) return false;
      if (priceRangeFilter === '1k_to_10k' && (item.unitPrice < 1000 || item.unitPrice > 10000)) return false;
      if (priceRangeFilter === 'above10k' && item.unitPrice <= 10000) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'qty_asc') return a.currentQty - b.currentQty;
      if (sortBy === 'qty_desc') return b.currentQty - a.currentQty;
      if (sortBy === 'price_desc') return (b.currentQty * b.unitPrice) - (a.currentQty * a.unitPrice);
      if (sortBy === 'price_asc') return a.unitPrice - b.unitPrice;
      if (sortBy === 'name_asc') return a.nameAr.localeCompare(b.nameAr, 'ar');
      return 0;
    });

  const handleResetAllFilters = () => {
    setSearch('');
    setSelectedCategoryFilter('all');
    setSelectedWarehouseFilter('all');
    setItemTypeFilter('all');
    setStockStatusFilter('all');
    setPriceRangeFilter('all');
    setSortBy('default');
  };

  const totalVal = inventoryItems.reduce((sum, i) => sum + (i.currentQty * i.unitPrice), 0);

  const handleExportCSV = (exportAll: boolean = false) => {
    const itemsToExport = exportAll ? inventoryItems : filtered;
    
    // CSV Header row
    const headers = [
      'كود الصنف',
      'اسم الصنف والكتالوج',
      'الفئة / التصنيف',
      'الموقع المستودعي',
      'الرصيد الفعلي المتاح',
      'وحدة القياس',
      'حد الطلب الأدنى (Reorder Level)',
      'حالة المخزون والتنبيه',
      'كمية العجز المطلوب شراؤها',
      'سعر الوحدة (ج.م)',
      'إجمالي القيمة الدفترية (ج.م)',
      'تاريخ التقرير'
    ];

    const todayDate = new Date().toISOString().slice(0, 10);

    const rows = itemsToExport.map(item => {
      const isLow = item.currentQty <= item.minQty;
      const isNear = !isLow && item.currentQty <= item.minQty * 1.5;
      const statusText = isLow ? 'تحت حد الطلب (عاجل)' : isNear ? 'اقترب من حد الطلب' : 'رصيد آمن ومطابق';
      const deficit = Math.max(0, item.minQty - item.currentQty);
      const totalValItem = item.currentQty * item.unitPrice;

      return [
        `"${(item.code || '').replace(/"/g, '""')}"`,
        `"${(item.nameAr || '').replace(/"/g, '""')}"`,
        `"${(item.category || '').replace(/"/g, '""')}"`,
        `"${(item.warehouseName || '').replace(/"/g, '""')}"`,
        item.currentQty,
        `"${(item.unit || '').replace(/"/g, '""')}"`,
        item.minQty,
        `"${statusText}"`,
        deficit,
        item.unitPrice,
        totalValItem,
        `"${todayDate}"`
      ].join(',');
    });

    // Summary calculation
    const totalCount = itemsToExport.length;
    const totalQtySum = itemsToExport.reduce((sum, i) => sum + i.currentQty, 0);
    const totalValSum = itemsToExport.reduce((sum, i) => sum + (i.currentQty * i.unitPrice), 0);
    const lowCount = itemsToExport.filter(i => i.currentQty <= i.minQty).length;

    // Add empty row and summary rows
    const summaryRow1 = ['', '=== الإجماليات والمؤشرات ===', '', '', totalQtySum, '', '', `أصناف تحت الحد: ${lowCount}`, '', '', totalValSum, ''];
    
    // Add UTF-8 BOM for Arabic character rendering in Microsoft Excel & Google Sheets
    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows,
      '',
      summaryRow1.map(val => typeof val === 'string' ? `"${val}"` : val).join(',')
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `تقرير_جرد_المخزون_ايجيبت_كرينز_${todayDate}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setReorderNotificationToast({
      show: true,
      msg: `تم بنجاح تصدير تقرير جرد المخزون (${itemsToExport.length} صنف) إلى ملف CSV جاهز للفتح في Excel! 📊`
    });
    setTimeout(() => {
      setReorderNotificationToast(null);
    }, 4000);
  };

  const handleQuickReorder = (item: InventoryItem) => {
    const recommendedQty = Math.max(item.minQty * 2, (item.minQty - item.currentQty) + item.minQty * 1.5);
    setReorderNotificationToast({
      show: true,
      msg: `تم إصدار أمر طلب شراء عاجل لتوريد (${Math.round(recommendedQty)} ${item.unit}) للصنف (${item.nameAr}) وتوجيهه لقسم المشتريات!`,
      itemName: item.nameAr
    });
    setTimeout(() => {
      setReorderNotificationToast(null);
    }, 4500);
  };

  const handleOpenReceiptForLowStock = (item: InventoryItem) => {
    setTxItemId(item.id);
    const needed = Math.max(1, item.minQty - item.currentQty + item.minQty);
    setTxQty(String(needed));
    setTxNotes(`سند توريد عاجل لتغطية عجز حد الطلب - الرصيد السابق (${item.currentQty} ${item.unit})`);
    setActiveTab('receipt');
  };

  const handleRegisterNewItemFromBarcode = (scannedCode: string) => {
    setCode(scannedCode);
    setShowAddForm(true);
    setActiveTab('items');
  };

  const handleSelectForReceiptFromBarcode = (item: InventoryItem) => {
    setTxItemId(item.id);
    setActiveTab('receipt');
  };

  const handleSelectForIssueFromBarcode = (item: InventoryItem) => {
    setTxItemId(item.id);
    setActiveTab('issue');
  };

  return (
    <div className="p-6 space-y-6 dir-rtl text-right font-sans">
      {/* Toast alert */}
      {reorderNotificationToast?.show && (
        <div className="fixed bottom-6 left-6 z-50 max-w-md bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <Check className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-white text-sm mb-0.5">إشعار إعادة الطلب السريع ⚡</h4>
            <p className="text-slate-300 leading-relaxed">{reorderNotificationToast.msg}</p>
          </div>
          <button 
            onClick={() => setReorderNotificationToast(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">مخازن قطع الغيار والمستهلكات (Inventory)</h1>
            {lowStockItems.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{lowStockItems.length} أصناف تحت حد الطلب</span>
              </span>
            )}
          </div>
          <p className="text-slate-500 mt-1 text-sm">متابعة أرصدة قطع الغيار والوايرات والزيوت مع نظام تنبيهات انخفاض المخزون عن حد الطلب (Reorder Level)</p>
        </div>
        <div className="flex flex-wrap gap-2 self-start">
          <button 
            onClick={() => setShowBarcodeScanner(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-blue-800 hover:to-cyan-800 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md active:scale-98"
            title="مسح باركود الأصناف بالكاميرا للتعرف السريع وتحديث الأرصدة"
          >
            <Scan className="w-5 h-5 text-cyan-200" />
            <span>مسح باركود بالكاميرا (Scanner) 📷</span>
          </button>
          <button 
            onClick={() => handleExportCSV(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md"
            title="تصدير قاعدة بيانات الأصناف بالكامل إلى ملف CSV متوافق مع Excel"
          >
            <Download className="w-5 h-5 text-emerald-400" /> تصدير جرد المخازن (CSV) 📊
          </button>
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
          className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === 'items' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>أرصدة الأصناف والكتالوج</span>
          {lowStockItems.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
              {lowStockItems.length}
            </span>
          )}
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
              handleQuickReorder(item);
            }
          }}
        />
      )}

      {activeTab === 'items' && (
        <div className="space-y-6">
          {/* Quick Metrics Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">إجمالي قيمة المخزون</span>
                <p className="text-lg font-black text-[#0F4C81]">{totalVal.toLocaleString()} ج.م</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0F4C81] flex items-center justify-center">
                <Archive className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">إجمالي الأصناف بالكتالوج</span>
                <p className="text-lg font-black text-slate-800">{inventoryItems.length} صنف</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center">
                <PackageCheck className="w-5 h-5" />
              </div>
            </div>

            <div 
              onClick={() => setStockStatusFilter('low')}
              className={`p-4.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                stockStatusFilter === 'low' 
                  ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500 shadow-sm' 
                  : 'bg-white border-slate-100 shadow-sm hover:border-rose-200'
              }`}
            >
              <div className="space-y-1">
                <span className="text-xs text-rose-600 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  أصناف تحت حد الطلب (Reorder Alert)
                </span>
                <p className="text-lg font-black text-rose-600">{lowStockItems.length} أصناف حرجة</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>

            <div 
              onClick={() => setStockStatusFilter('warning')}
              className={`p-4.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                stockStatusFilter === 'warning' 
                  ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500 shadow-sm' 
                  : 'bg-white border-slate-100 shadow-sm hover:border-amber-200'
              }`}
            >
              <div className="space-y-1">
                <span className="text-xs text-amber-600 font-bold flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5" />
                  اقتربت من حد الطلب
                </span>
                <p className="text-lg font-black text-amber-600">{nearReorderItems.length} أصناف للمتابعة</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <BellRing className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* 🚨 Low Stock / Reorder Alert Interactive Banner */}
          {lowStockItems.length > 0 && (
            <div className="p-5 bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-2 border-rose-200 rounded-2xl shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-200/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-rose-600 text-white rounded-xl shadow-xs">
                    <ShieldAlert className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-rose-900 flex items-center gap-2">
                      <span>تنبيه هبوط المخزون عن حد الطلب (Reorder Level Trigger)</span>
                      <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-full">
                        {lowStockItems.length} أصناف تستوجب الشراء فوراً
                      </span>
                    </h3>
                    <p className="text-xs text-rose-700 mt-0.5">
                      الأصناف التالية انخفض رصيدها الفعلي بالمخازن عن الحد الأدنى المحدد لإعادة الطلب، يرجى إصدار أوامر توريد لتفادي توقف الصيانة وعمليات التشغيل.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => setStockStatusFilter(stockStatusFilter === 'low' ? 'all' : 'low')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      stockStatusFilter === 'low'
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'bg-white border border-rose-300 text-rose-800 hover:bg-rose-100'
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>{stockStatusFilter === 'low' ? 'إلغاء تصفية التنبيهات' : 'عرض الأصناف الحرجة فقط بالجدول'}</span>
                  </button>
                </div>
              </div>

              {/* Grid of Alert Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {lowStockItems.map(item => {
                  const deficit = Math.max(0, item.minQty - item.currentQty);
                  const percentage = Math.round((item.currentQty / (item.minQty || 1)) * 100);
                  return (
                    <div 
                      key={item.id} 
                      className="p-3.5 bg-white/95 rounded-xl border border-rose-200 hover:border-rose-400 shadow-3xs transition-all flex flex-col justify-between gap-2.5"
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-bounce" />
                            <span className="font-bold text-slate-900 text-xs line-clamp-1">{item.nameAr}</span>
                          </div>
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black rounded-md shrink-0">
                            عجز: {deficit} {item.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                          <span>كود: <strong className="font-mono text-slate-700">{item.code}</strong></span>
                          <span>المستودع: <strong className="text-slate-700">{item.warehouseName.split('-')[0]}</strong></span>
                        </div>
                      </div>

                      {/* Stock Level Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-rose-700">الرصيد: {item.currentQty} {item.unit}</span>
                          <span className="text-slate-600">حد الطلب: {item.minQty} {item.unit}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(8, percentage))}%` }}
                          />
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => handleQuickReorder(item)}
                          className="flex-1 py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-3xs"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>طلب توريد عاجل</span>
                        </button>
                        <button
                          onClick={() => handleOpenReceiptForLowStock(item)}
                          className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                          title="إضافة سند وارد مباشر للمخزن"
                        >
                          <span>سند وارد 📥</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Actions & Export Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-[#0F4C81] rounded-xl">
                <Warehouse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">قائمة المخزون وقطع الغيار</h3>
                <p className="text-[11px] text-slate-500 font-medium">إدارة الأرصدة، الفئات، المستودعات، وحدود إعادة الطلب</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleExportCSV(false)}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:shadow-md"
                title="تصدير جدول الأصناف المصفاة الحالية إلى ملف CSV للأرشفة وبرامج الجرد"
              >
                <Download className="w-4 h-4" />
                <span>تصدير CSV 📊</span>
              </button>

              <ExportPDFButton
                variant="primary"
                titleAr="تصدير تقرير المخزون والتنبيهات PDF 📄"
                titleEn="Export Inventory & Alerts PDF Report"
                exportOptions={{
                  titleAr: 'تقرير تقييم حركة المخزون وحالة حدود إعادة الطلب - إيجيبت كرينز',
                  titleEn: 'Spare Parts Inventory & Reorder Level Status Report',
                  subtitleAr: `حصر شامل لعدد (${filtered.length}) صنف مخزني ${selectedCategoryFilter !== 'all' ? `[فئة: ${selectedCategoryFilter}]` : ''} ${selectedWarehouseFilter !== 'all' ? `[مستودع: ${selectedWarehouseFilter}]` : ''}`,
                  filename: 'inventory_spare_parts_reorder_report',
                  columns: [
                    { headerAr: 'كود الصنف', accessor: 'code', align: 'center', width: '100px' },
                    { headerAr: 'اسم الصنف والكتالوج', accessor: 'nameAr', align: 'right' },
                    { headerAr: 'الفئة', accessor: 'category', align: 'right' },
                    { headerAr: 'الموقع المستودعي', accessor: 'warehouseName', align: 'right' },
                    { headerAr: 'الرصيد المتاح', accessor: (row) => `${row.currentQty} ${row.unit}`, align: 'center', width: '110px' },
                    { headerAr: 'حد الطلب', accessor: (row) => `${row.minQty} ${row.unit}`, align: 'center', width: '100px' },
                    { headerAr: 'حالة التنبيه', accessor: (row) => row.currentQty <= row.minQty ? 'تحت حد الطلب (عاجل)' : row.currentQty <= row.minQty * 1.5 ? 'اقترب من الحد' : 'آمن ومستقر', align: 'center', width: '120px' },
                    { headerAr: 'سعر الوحدة', accessor: (row) => `${Number(row.unitPrice).toLocaleString()} ج.م`, align: 'left', width: '110px' },
                    { headerAr: 'القيمة الإجمالية', accessor: (row) => `${Number(row.currentQty * row.unitPrice).toLocaleString()} ج.م`, align: 'left', width: '130px' }
                  ],
                  data: filtered,
                  summaryItems: [
                    { labelAr: 'إجمالي قيمة المخزون', value: `${filtered.reduce((acc, curr) => acc + (curr.currentQty * curr.unitPrice), 0).toLocaleString()} ج.م`, highlight: true },
                    { labelAr: 'عدد الأصناف المعروضة', value: `${filtered.length} صنف` },
                    { labelAr: 'أصناف تحت حد الطلب', value: `${filtered.filter(i => i.currentQty <= i.minQty).length} أصناف حرجة` }
                  ]
                }}
              />
            </div>
          </div>

          {/* Dedicated Category & Warehouse Filters Bar */}
          <InventoryCategoryFilters
            inventoryItems={inventoryItems}
            search={search}
            setSearch={setSearch}
            selectedCategory={selectedCategoryFilter}
            setSelectedCategory={setSelectedCategoryFilter}
            selectedWarehouse={selectedWarehouseFilter}
            setSelectedWarehouse={setSelectedWarehouseFilter}
            itemTypeFilter={itemTypeFilter}
            setItemTypeFilter={setItemTypeFilter}
            stockStatusFilter={stockStatusFilter}
            setStockStatusFilter={setStockStatusFilter}
            priceRangeFilter={priceRangeFilter}
            setPriceRangeFilter={setPriceRangeFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            viewMode={viewMode}
            setViewMode={setViewMode}
            filteredCount={filtered.length}
            totalCount={inventoryItems.length}
            filteredValue={filtered.reduce((acc, curr) => acc + (curr.currentQty * curr.unitPrice), 0)}
            filteredLowCount={filtered.filter(i => i.currentQty <= i.minQty).length}
            onOpenBarcodeScanner={() => setShowBarcodeScanner(true)}
            onResetAllFilters={handleResetAllFilters}
          />

          {/* Mode 1: Table View */}
          {viewMode === 'table' && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-700">
                      <th className="px-5 py-4 font-bold text-xs">كود الصنف</th>
                      <th className="px-5 py-4 font-bold text-xs">الصنف وتنبيه حد الطلب</th>
                      <th className="px-5 py-4 font-bold text-xs">الفئة والتصنيف</th>
                      <th className="px-5 py-4 font-bold text-xs">الموقع المستودعي</th>
                      <th className="px-5 py-4 font-bold text-xs">الرصيد الفعلي vs حد الطلب</th>
                      <th className="px-5 py-4 font-bold text-xs">سعر الوحدة</th>
                      <th className="px-5 py-4 font-bold text-xs">القيمة الإجمالية</th>
                      <th className="px-5 py-4 font-bold text-xs text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                          <Archive className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                          <p className="text-sm font-bold">لا توجد أصناف مطابقة لمعايير البحث والتصفية المحددة.</p>
                          <button
                            onClick={handleResetAllFilters}
                            className="mt-3 px-3 py-1.5 bg-blue-50 text-[#0F4C81] rounded-lg text-xs font-bold hover:bg-blue-100 cursor-pointer"
                          >
                            إلغاء التصفية وعرض كل الأصناف
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filtered.map(item => {
                        const isLow = item.currentQty <= item.minQty;
                        const isNear = !isLow && item.currentQty <= item.minQty * 1.5;
                        const deficit = Math.max(0, item.minQty - item.currentQty);
                        const stockPercentage = Math.min(100, Math.round((item.currentQty / (item.minQty * 2 || 1)) * 100));

                        return (
                          <tr 
                            key={item.id} 
                            className={`transition-colors ${
                              isLow 
                                ? 'bg-rose-50/40 hover:bg-rose-50/70 border-r-4 border-rose-500' 
                                : isNear 
                                ? 'bg-amber-50/20 hover:bg-amber-50/40 border-r-4 border-amber-400' 
                                : 'hover:bg-slate-50/60 border-r-4 border-transparent'
                            }`}
                          >
                            {/* Code */}
                            <td className="px-5 py-4 font-mono font-bold text-slate-600 text-xs">
                              <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                                {item.code}
                              </span>
                            </td>

                            {/* Item Name with Warning Icon & Status Badge */}
                            <td className="px-5 py-4">
                              <div className="flex items-start gap-2.5">
                                {/* Pulsing indicator or Warning Icon */}
                                <div className="pt-0.5">
                                  {isLow ? (
                                    <div className="p-1 bg-rose-100 text-rose-600 rounded-lg border border-rose-200" title="تحذير: الصنف تحت حد الطلب الأدنى">
                                      <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
                                    </div>
                                  ) : isNear ? (
                                    <div className="p-1 bg-amber-100 text-amber-600 rounded-lg border border-amber-200" title="تنبيه: الصنف يقترب من حد الطلب">
                                      <Bell className="w-4 h-4 text-amber-600" />
                                    </div>
                                  ) : (
                                    <div className="p-1 bg-emerald-50 text-emerald-600 rounded-lg" title="الرصيد في المستوى الآمن">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-bold text-slate-900 text-sm">{item.nameAr}</span>
                                    {isLow && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white shadow-3xs">
                                        <AlertTriangle className="w-3 h-3 text-white" />
                                        <span>تحت حد الطلب (عجز: {deficit} {item.unit})</span>
                                      </span>
                                    )}
                                    {isNear && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                        <Bell className="w-3 h-3 text-amber-700" />
                                        <span>اقترب من حد الطلب</span>
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-400 block font-medium">
                                    وحدة القياس: <strong className="text-slate-600">{item.unit}</strong>
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Category with Clickable Filter */}
                            <td className="px-5 py-4 text-slate-600 font-medium text-xs">
                              <button
                                onClick={() => setSelectedCategoryFilter(item.category)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 hover:text-[#0F4C81] rounded-lg text-slate-700 font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title={`تصفية وعرض كل أصناف فئة: ${item.category}`}
                              >
                                {getCategoryIcon(item.category)}
                                <span>{item.category}</span>
                              </button>
                            </td>

                            {/* Warehouse with Clickable Filter */}
                            <td className="px-5 py-4">
                              <button
                                onClick={() => setSelectedWarehouseFilter(item.warehouseName)}
                                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                title={`تصفية وعرض كل أصناف مستودع: ${item.warehouseName}`}
                              >
                                <Warehouse className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="font-semibold">{item.warehouseName}</span>
                              </button>
                            </td>

                            {/* Stock vs Reorder Level */}
                            <td className="px-5 py-4">
                              <div className="space-y-1.5 w-44">
                                <div className="flex items-center justify-between text-xs font-bold">
                                  <span className={isLow ? 'text-rose-600 font-black' : isNear ? 'text-amber-700' : 'text-slate-800'}>
                                    الرصيد: {item.currentQty} {item.unit}
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-medium">
                                    حد الطلب: {item.minQty}
                                  </span>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                      isLow ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.max(6, stockPercentage)}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Unit price */}
                            <td className="px-5 py-4 font-semibold text-slate-700 text-xs">
                              {item.unitPrice.toLocaleString()} ج.م
                            </td>

                            {/* Total value */}
                            <td className="px-5 py-4 font-extrabold text-[#0F4C81] text-xs">
                              {(item.currentQty * item.unitPrice).toLocaleString()} ج.م
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {isLow ? (
                                  <button
                                    onClick={() => handleQuickReorder(item)}
                                    className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-black flex items-center gap-1 transition-colors cursor-pointer shadow-3xs"
                                    title="إرسال طلب شراء فوري"
                                  >
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                    <span>طلب شراء ⚡</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleOpenReceiptForLowStock(item)}
                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                                    title="تسجيل إذن إضافة وارد مخازن"
                                  >
                                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>وارد</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mode 2: Cards Grid View */}
          {viewMode === 'cards' && (
            <div>
              {filtered.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400">
                  <Archive className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-bold">لا توجد أصناف مطابقة لمعايير البحث والتصفية المحددة.</p>
                  <button
                    onClick={handleResetAllFilters}
                    className="mt-3 px-4 py-2 bg-blue-50 text-[#0F4C81] rounded-xl text-xs font-bold hover:bg-blue-100 cursor-pointer"
                  >
                    إلغاء التصفية وعرض كل الأصناف
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map(item => {
                    const isLow = item.currentQty <= item.minQty;
                    const isNear = !isLow && item.currentQty <= item.minQty * 1.5;
                    const deficit = Math.max(0, item.minQty - item.currentQty);
                    const stockPercentage = Math.min(100, Math.round((item.currentQty / (item.minQty * 2 || 1)) * 100));

                    return (
                      <div
                        key={item.id}
                        className={`bg-white rounded-2xl p-4 border transition-all hover:shadow-md space-y-3 flex flex-col justify-between ${
                          isLow
                            ? 'border-rose-300 bg-rose-50/20'
                            : isNear
                            ? 'border-amber-300 bg-amber-50/10'
                            : 'border-slate-200 hover:border-[#0F4C81]/40'
                        }`}
                      >
                        <div>
                          {/* Header row */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                              {item.code}
                            </span>
                            <div className="flex items-center gap-1">
                              {isLow && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>عجز {deficit} {item.unit}</span>
                                </span>
                              )}
                              {isNear && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  <Bell className="w-3 h-3" />
                                  <span>اقترب من الحد</span>
                                </span>
                              )}
                              {!isLow && !isNear && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>رصيد آمن</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Item Name */}
                          <h4 className="font-bold text-slate-900 text-sm leading-snug mb-2">{item.nameAr}</h4>

                          {/* Chips: Category & Warehouse */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-3">
                            <button
                              onClick={() => setSelectedCategoryFilter(item.category)}
                              className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#0F4C81] rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="تصفية حسب هذه الفئة"
                            >
                              {getCategoryIcon(item.category)}
                              <span>{item.category}</span>
                            </button>

                            <button
                              onClick={() => setSelectedWarehouseFilter(item.warehouseName)}
                              className="px-2 py-0.5 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="تصفية حسب هذا المستودع"
                            >
                              <Warehouse className="w-3 h-3 text-indigo-600" />
                              <span>{item.warehouseName}</span>
                            </button>
                          </div>

                          {/* Stock Gauge */}
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className={isLow ? 'text-rose-600 font-extrabold' : isNear ? 'text-amber-700' : 'text-slate-800'}>
                                الرصيد: {item.currentQty} {item.unit}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                حد الطلب: {item.minQty} {item.unit}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${
                                  isLow ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.max(6, stockPercentage)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Footer: Price & Actions */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">سعر الوحدة / القيمة</span>
                            <span className="font-extrabold text-xs text-[#0F4C81]">
                              {item.unitPrice.toLocaleString()} ج.م
                              <span className="text-[10px] text-slate-500 font-normal mr-1">
                                (إجمالي: {(item.currentQty * item.unitPrice).toLocaleString()} ج.م)
                              </span>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isLow ? (
                              <button
                                onClick={() => handleQuickReorder(item)}
                                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black flex items-center gap-1 transition-colors cursor-pointer shadow-3xs"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>طلب شراء</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenReceiptForLowStock(item)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                <span>وارد</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-600">اختر صنف مخازن</label>
                <button
                  type="button"
                  onClick={() => setShowBarcodeScanner(true)}
                  className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-cyan-200 cursor-pointer transition-colors"
                  title="مسح باركود الصنف بالكاميرا لتحديده فورياً"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-700" />
                  <span>مسح باركود الصنف 📷</span>
                </button>
              </div>
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-600">كود الصنف / الباركود</label>
                    <button
                      type="button"
                      onClick={() => setShowBarcodeScanner(true)}
                      className="text-[10px] text-blue-700 hover:text-blue-900 font-bold flex items-center gap-0.5"
                      title="مسح باركود الصنف من المنتج بالكاميرا"
                    >
                      <Camera className="w-3 h-3" />
                      <span>مسح 📷</span>
                    </button>
                  </div>
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
                    placeholder="الكمية الحالية"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-rose-700 mb-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>حد الطلب (Reorder Level)</span>
                  </label>
                  <input 
                    type="number" 
                    required
                    placeholder="حد التنبيه الأدنى"
                    value={minQty}
                    onChange={(e) => setMinQty(e.target.value)}
                    className="w-full px-4 py-2 border border-rose-200 focus:border-rose-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-rose-50/20 font-bold"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                💡 <strong className="text-slate-600">حد الطلب (Reorder Level):</strong> عند انخفاض رصيد الصنف عن هذه القيمة سيطلق النظام تنبيهاً مرئياً وأيقونة تحذير لطلب الشراء فورياً.
              </p>

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

      {/* Barcode & QR Camera Scanner Modal */}
      <BarcodeScannerModal
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        inventoryItems={inventoryItems}
        costCenters={costCenters}
        onUpdateInventoryQty={onUpdateInventoryQty}
        onRegisterNewItemWithCode={handleRegisterNewItemFromBarcode}
        onSelectForReceipt={handleSelectForReceiptFromBarcode}
        onSelectForIssue={handleSelectForIssueFromBarcode}
      />

    </div>
  );
}
