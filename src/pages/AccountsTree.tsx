import React, { useState, useEffect } from 'react';
import { AccountNode } from '../types';
import { initialAccounts } from '../mockData';
import { 
  Folder, FolderOpen, Plus, Search, Edit2, Trash2, Layers, 
  ChevronDown, AlertCircle, CheckCircle2, Landmark, ShieldCheck, 
  Wallet, TrendingUp, HelpCircle, FileSpreadsheet, ListCollapse, FolderPlus,
  UploadCloud, X, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TreeNodeProps {
  key?: string;
  node: AccountNode;
  onAddAccount: (parentNode: AccountNode) => void;
  onEditAccount: (node: AccountNode) => void;
  onDeleteAccount: (id: string) => void;
  searchQuery: string;
  selectedTypeFilter: string;
}

function TreeNode({ 
  node, 
  onAddAccount, 
  onEditAccount, 
  onDeleteAccount, 
  searchQuery, 
  selectedTypeFilter 
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  
  // Highlight search matches
  const matchesSearch = searchQuery === '' || 
    node.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) || 
    node.code.includes(searchQuery);

  const matchesType = selectedTypeFilter === 'all' || node.type === selectedTypeFilter;

  // Auto expand parent if search query matches a child
  useEffect(() => {
    if (searchQuery !== '') {
      const checkDescendantMatch = (n: AccountNode): boolean => {
        if (n.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) || n.code.includes(searchQuery)) {
          return true;
        }
        return !!n.children?.some(checkDescendantMatch);
      };
      const hasMatchingChild = node.children?.some(checkDescendantMatch);
      if (hasMatchingChild) {
        setExpanded(true);
      }
    }
  }, [searchQuery, node]);

  // Recursively filter children based on search and type
  const displayChildren = node.children?.filter(child => {
    const checkMatch = (n: AccountNode): boolean => {
      const matchText = searchQuery === '' || 
        n.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.code.includes(searchQuery);
      
      const matchType = selectedTypeFilter === 'all' || n.type === selectedTypeFilter;
      
      if (matchText && matchType) return true;
      return !!n.children?.some(checkMatch);
    };
    return checkMatch(child);
  });

  return (
    <div className="mr-4 space-y-1 text-right font-sans">
      <div 
        className={`flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 border ${
          matchesSearch && searchQuery !== '' 
            ? 'bg-blue-50/70 border-blue-200 ring-2 ring-[#0F4C81]/20 shadow-xs' 
            : 'bg-white/50 backdrop-blur-xs hover:bg-white/80 border-slate-200/50 shadow-3xs hover:shadow-xs'
        } ${!matchesType ? 'opacity-50 hover:opacity-85' : ''}`}
      >
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="p-1.5 hover:bg-slate-200/50 rounded-lg text-slate-500 transition-colors cursor-pointer"
          >
            {hasChildren ? (
              expanded ? <FolderOpen className="w-5 h-5 text-amber-500" /> : <Folder className="w-5 h-5 text-amber-500" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-[#0F4C81] mx-1.5 block" />
            )}
          </button>
          
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] px-2.5 py-0.5 bg-slate-200/50 rounded-lg text-slate-600 font-black border border-slate-200/40">{node.code}</span>
              <span className={`text-xs sm:text-sm font-black text-slate-800 ${matchesSearch && searchQuery !== '' ? 'text-[#0F4C81]' : ''}`}>
                {node.nameAr}
              </span>
              
              {/* Type Badge */}
              {node.type === 'assets' && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">الأصول</span>
              )}
              {node.type === 'liabilities' && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-100">الخصوم</span>
              )}
              {node.type === 'equity' && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">حقوق الملكية</span>
              )}
              {node.type === 'revenues' && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-bold border border-cyan-100">الإيرادات</span>
              )}
              {node.type === 'expenses' && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-100">المصروفات</span>
              )}
            </div>
            
            <div className="flex gap-2 items-center mt-1 text-[10px] text-slate-400 font-bold">
              <span>مستوى الدليل: {node.code.split('.').length}</span>
              {hasChildren && <span>• يحتوي على ({node.children?.length}) حسابات فرعية</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-left pl-2">
            <span className="font-mono font-black text-sm text-[#0F4C81] block">
              {node.balance.toLocaleString('ar-EG')} ج.م
            </span>
          </div>
          
          {/* Node Actions */}
          <div className="flex items-center gap-1.5 bg-slate-100/50 p-1 rounded-xl border border-slate-200/30">
            <button 
              onClick={() => onAddAccount(node)}
              className="p-1.5 bg-white hover:bg-emerald-50 text-emerald-600 rounded-lg border border-slate-200/40 transition-all cursor-pointer hover:shadow-3xs"
              title="إضافة حساب فرعي"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => onEditAccount(node)}
              className="p-1.5 bg-white hover:bg-blue-50 text-blue-600 rounded-lg border border-slate-200/40 transition-all cursor-pointer hover:shadow-3xs"
              title="تعديل الحساب"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => onDeleteAccount(node.id)}
              className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 rounded-lg border border-slate-200/40 transition-all cursor-pointer hover:shadow-3xs"
              title="إلغاء وحذف الحساب"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {hasChildren && expanded && displayChildren && displayChildren.length > 0 && (
        <div className="border-r border-slate-200 mr-3 pr-3 space-y-1">
          {displayChildren.map(child => (
            <TreeNode 
              key={child.id} 
              node={child} 
              onAddAccount={onAddAccount} 
              onEditAccount={onEditAccount}
              onDeleteAccount={onDeleteAccount}
              searchQuery={searchQuery}
              selectedTypeFilter={selectedTypeFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AccountsTree() {
  const [rootAccount, setRootAccount] = useState<AccountNode>(initialAccounts);
  const [search, setSearch] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  
  // States for CSV/Excel accounts import
  const [showImportModal, setShowImportModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Column Map & Preview, 3: Finish
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fileRows, setFileRows] = useState<any[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    code: 'كود الحساب',
    nameAr: 'اسم الحساب',
    balance: 'الرصيد الافتتاحي',
    type: 'نوع الحساب',
    parentCode: 'كود الأب'
  });

  const insertNodeByParentCode = (current: AccountNode, parentCode: string, newNode: AccountNode): { node: AccountNode; found: boolean } => {
    if (current.code === parentCode) {
      const exists = current.children?.some(child => child.code === newNode.code);
      if (exists) {
        return { node: current, found: true };
      }
      return {
        node: {
          ...current,
          children: [...(current.children || []), newNode],
          balance: current.balance + (newNode.balance || 0)
        },
        found: true
      };
    }

    if (current.children && current.children.length > 0) {
      let foundAny = false;
      const updatedChildren = current.children.map(child => {
        const res = insertNodeByParentCode(child, parentCode, newNode);
        if (res.found) {
          foundAny = true;
        }
        return res.node;
      });

      if (foundAny) {
        return {
          node: {
            ...current,
            children: updatedChildren,
            balance: current.balance + (newNode.balance || 0)
          },
          found: true
        };
      }
    }

    return { node: current, found: false };
  };

  const findAccountNodeByCode = (current: AccountNode, targetCode: string): AccountNode | null => {
    if (current.code === targetCode) return current;
    if (current.children) {
      for (const child of current.children) {
        const found = findAccountNodeByCode(child, targetCode);
        if (found) return found;
      }
    }
    return null;
  };

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
      { key: 'code', ar: ['كود الحساب', 'كود', 'code', 'رمز الحساب'] },
      { key: 'nameAr', ar: ['اسم الحساب', 'اسم', 'الاسم', 'nameAr', 'name'] },
      { key: 'balance', ar: ['الرصيد الافتتاحي', 'الرصيد', 'رصيد', 'balance'] },
      { key: 'type', ar: ['نوع الحساب', 'النوع', 'تصنيف', 'type'] },
      { key: 'parentCode', ar: ['كود الأب', 'الحساب الرئيسي', 'الحساب الأب', 'parentCode', 'parent'] }
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
    const mockHeaders = ['كود الحساب', 'اسم الحساب', 'الرصيد الافتتاحي', 'نوع الحساب', 'كود الأب'];
    const mockRows = [
      ['1.1.01.0003', 'حساب بنك مصر - العملة الأجنبية', '1250000', 'assets', '1.1.01'],
      ['1.1.01.0004', 'حساب البنك الأهلي المصري', '750000', 'assets', '1.1.01'],
      ['1.2.02.0005', 'ذمم الموردين - شركة الخليج للرافعات', '230000', 'liabilities', '1.2.02'],
      ['1.5.01.0012', 'مصاريف المحروقات والديزل لتشغيل الأوناش', '14500', 'expenses', '1.5.01'],
      ['1.4.01.0003', 'إيرادات عقود تأجير الأوناش التلسكوبية', '540000', 'revenues', '1.4.01'],
    ];
    setFileHeaders(mockHeaders);
    setFileRows(mockRows);
    setImportStep(2);
    setImportFile({ name: 'egypt_cranes_chart_of_accounts.xlsx' } as any);
  };

  const importedAccounts = React.useMemo(() => {
    if (importStep !== 2) return [];

    return fileRows.map((row, rowIndex) => {
      const getVal = (key: string) => {
        const headerName = columnMapping[key];
        const headerIdx = fileHeaders.indexOf(headerName);
        return headerIdx !== -1 ? row[headerIdx] : '';
      };

      const codeVal = getVal('code') || `imported-${rowIndex + 1}`;
      const nameArVal = getVal('nameAr') || '';
      const balanceVal = parseFloat(getVal('balance')) || 0;
      
      let rawType = getVal('type')?.toLowerCase() || 'assets';
      let typeVal: 'assets' | 'liabilities' | 'equity' | 'revenues' | 'expenses' = 'assets';
      if (rawType.includes('خصم') || rawType.includes('خصوم') || rawType === 'liabilities') typeVal = 'liabilities';
      else if (rawType.includes('حقوق') || rawType.includes('ملكية') || rawType === 'equity') typeVal = 'equity';
      else if (rawType.includes('إيراد') || rawType.includes('ايراد') || rawType === 'revenues') typeVal = 'revenues';
      else if (rawType.includes('مصروف') || rawType.includes('مصاريف') || rawType === 'expenses') typeVal = 'expenses';

      let parentCodeVal = getVal('parentCode');
      if (!parentCodeVal && codeVal.includes('.')) {
        parentCodeVal = codeVal.substring(0, codeVal.lastIndexOf('.'));
      }

      // Validation
      const errors: string[] = [];
      if (!nameArVal) {
        errors.push('اسم الحساب مطلوب');
      }
      if (!codeVal) {
        errors.push('كود الحساب مطلوب');
      }

      const parentInTree = parentCodeVal ? findAccountNodeByCode(rootAccount, parentCodeVal) : null;
      const parentInImport = parentCodeVal ? fileRows.some((r) => {
        const otherCode = r[fileHeaders.indexOf(columnMapping['code'])];
        return otherCode === parentCodeVal;
      }) : false;

      if (parentCodeVal && !parentInTree && !parentInImport) {
        errors.push(`الحساب الرئيسي غير موجود (${parentCodeVal})`);
      }

      return {
        item: {
          id: Math.random().toString(36).substring(2, 9),
          code: codeVal,
          nameAr: nameArVal,
          balance: balanceVal,
          type: typeVal,
          children: []
        } as AccountNode,
        parentCode: parentCodeVal || rootAccount.code,
        errors,
        isValid: errors.length === 0
      };
    });
  }, [fileRows, fileHeaders, columnMapping, importStep, rootAccount]);

  const handleConfirmImport = () => {
    const validAccounts = importedAccounts.filter(a => a.isValid);
    if (validAccounts.length === 0) {
      triggerNotification('لا توجد حسابات صالحة للاستيراد!', 'error');
      return;
    }

    let tempRoot = { ...rootAccount };
    let successCount = 0;

    const sorted = [...validAccounts].sort((a, b) => a.item.code.length - b.item.code.length);

    sorted.forEach(entry => {
      const res = insertNodeByParentCode(tempRoot, entry.parentCode, entry.item);
      if (res.found) {
        tempRoot = res.node;
        successCount++;
      }
    });

    setRootAccount(tempRoot);
    triggerNotification(`تم بنجاح استيراد عدد (${successCount}) حساب جديد إلى الدليل المحاسبي`, 'success');
    setShowImportModal(false);
    setImportFile(null);
    setFileHeaders([]);
    setFileRows([]);
    setImportStep(1);
  };
  
  // Custom dialog notifications and confirmations
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState<AccountNode | null>(null);
  
  // Add Form state
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newBalance, setNewBalance] = useState('0');
  const [newType, setNewType] = useState<'assets' | 'liabilities' | 'equity' | 'revenues' | 'expenses'>('assets');

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEditNode, setSelectedEditNode] = useState<AccountNode | null>(null);
  
  // Edit Form state
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('0');
  const [editType, setEditType] = useState<'assets' | 'liabilities' | 'equity' | 'revenues' | 'expenses'>('assets');

  // Show customized in-app alert instead of browser alert
  const triggerNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Pre-calculate statistics
  const getStats = () => {
    let totalNodes = 0;
    let assetsSum = 0;
    let liabilitiesSum = 0;
    let equitySum = 0;
    let revenuesSum = 0;
    let expensesSum = 0;

    const traverse = (node: AccountNode) => {
      totalNodes++;
      if (node.type === 'assets') assetsSum += node.balance;
      else if (node.type === 'liabilities') liabilitiesSum += node.balance;
      else if (node.type === 'equity') equitySum += node.balance;
      else if (node.type === 'revenues') revenuesSum += node.balance;
      else if (node.type === 'expenses') expensesSum += node.balance;

      if (node.children && node.children.length > 0) {
        node.children.forEach(traverse);
      }
    };

    traverse(rootAccount);
    return { totalNodes, assetsSum, liabilitiesSum, equitySum, revenuesSum, expensesSum };
  };

  const stats = getStats();

  const handleOpenAdd = (parentNode: AccountNode) => {
    setSelectedParent(parentNode);
    // Auto-generate code based on parent
    setNewCode(`${parentNode.code}.${(parentNode.children?.length || 0) + 1}`);
    setNewType(parentNode.type);
    setShowAddModal(true);
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParent) return;

    if (!newName.trim() || !newCode.trim()) {
      triggerNotification('الرجاء إدخال الاسم والرمز أولاً', 'error');
      return;
    }

    const newAccount: AccountNode = {
      id: Math.random().toString(36).substring(2, 9),
      code: newCode,
      nameAr: newName,
      balance: parseFloat(newBalance) || 0,
      type: newType,
      children: []
    };

    // Correct recursive addition that only updates ancestors of the added node
    const addNodeRecursive = (current: AccountNode): { node: AccountNode; found: boolean } => {
      if (current.id === selectedParent.id) {
        const updated = {
          ...current,
          children: [...(current.children || []), newAccount],
          balance: current.balance + (newAccount.balance || 0)
        };
        return { node: updated, found: true };
      }
      
      if (current.children && current.children.length > 0) {
        let foundAny = false;
        const updatedChildren = current.children.map(child => {
          const res = addNodeRecursive(child);
          if (res.found) {
            foundAny = true;
          }
          return res.node;
        });
        
        if (foundAny) {
          return {
            node: {
              ...current,
              children: updatedChildren,
              balance: current.balance + (newAccount.balance || 0)
            },
            found: true
          };
        }
      }
      
      return { node: current, found: false };
    };

    const res = addNodeRecursive(rootAccount);
    if (res.found) {
      setRootAccount(res.node);
      triggerNotification(`تمت إضافة الحساب الفرعي "${newName}" بنجاح`, 'success');
    } else {
      triggerNotification('حدث خطأ أثناء تحديد الحساب الرئيسي للتعديل', 'error');
    }

    setShowAddModal(false);
    setNewName('');
    setNewBalance('0');
  };

  const handleOpenEdit = (node: AccountNode) => {
    setSelectedEditNode(node);
    setEditCode(node.code);
    setEditName(node.nameAr);
    setEditBalance(node.balance.toString());
    setEditType(node.type);
    setShowEditModal(true);
  };

  const handleEditAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditNode) return;

    if (!editName.trim() || !editCode.trim()) {
      triggerNotification('الرجاء تعبئة كافة الحقول المطلوبة', 'error');
      return;
    }

    const updatedNodeInfo = {
      code: editCode,
      nameAr: editName,
      balance: parseFloat(editBalance) || 0,
      type: editType
    };

    const updateNodeRecursive = (current: AccountNode): { node: AccountNode; balanceDiff: number } => {
      if (current.id === selectedEditNode.id) {
        const balanceDiff = updatedNodeInfo.balance - current.balance;
        
        // Recursively update descendants' types if parent type is changed
        const updateTypeRecursive = (n: AccountNode): AccountNode => {
          return {
            ...n,
            type: updatedNodeInfo.type,
            children: n.children?.map(updateTypeRecursive)
          };
        };

        return {
          node: {
            ...current,
            code: updatedNodeInfo.code,
            nameAr: updatedNodeInfo.nameAr,
            balance: updatedNodeInfo.balance,
            type: updatedNodeInfo.type,
            children: current.children?.map(updateTypeRecursive)
          },
          balanceDiff
        };
      }

      if (current.children) {
        let totalDiff = 0;
        const updatedChildren = current.children.map(child => {
          const res = updateNodeRecursive(child);
          totalDiff += res.balanceDiff;
          return res.node;
        });
        return {
          node: {
            ...current,
            children: updatedChildren,
            balance: current.balance + totalDiff
          },
          balanceDiff: totalDiff
        };
      }

      return { node: current, balanceDiff: 0 };
    };

    const res = updateNodeRecursive(rootAccount);
    setRootAccount(res.node);
    triggerNotification(`تم تحديث بيانات الحساب "${editName}" بنجاح`, 'success');
    setShowEditModal(false);
    setSelectedEditNode(null);
  };

  const handleDeleteAccount = (id: string) => {
    if (id === rootAccount.id) {
      triggerNotification('لا يمكن حذف الحساب الجذري الرئيسي للدليل المحاسبي!', 'error');
      return;
    }

    const deleteNodeRecursive = (current: AccountNode): { node: AccountNode | null; balanceSubtracted: number } => {
      if (current.id === id) {
        return { node: null, balanceSubtracted: current.balance };
      }

      if (current.children) {
        let balanceSubtracted = 0;
        const newChildren: AccountNode[] = [];
        for (const child of current.children) {
          const res = deleteNodeRecursive(child);
          if (res.node !== null) {
            newChildren.push(res.node);
          }
          balanceSubtracted += res.balanceSubtracted;
        }
        return {
          node: {
            ...current,
            children: newChildren,
            balance: current.balance - balanceSubtracted
          },
          balanceSubtracted
        };
      }

      return { node: current, balanceSubtracted: 0 };
    };

    // In-app interactive confirm dialogue instead of confirm()
    setConfirmDialog({
      isOpen: true,
      message: 'هل أنت متأكد تماماً من رغبتك في حذف هذا الحساب وكافة الحسابات الفرعية التابعة له؟ سيتم خصم رصيده تلقائياً من الحسابات العليا.',
      onConfirm: () => {
        const res = deleteNodeRecursive(rootAccount);
        if (res.node) {
          setRootAccount(res.node);
          triggerNotification('تم حذف الحساب وتحديث موازنة الشجرة بنجاح', 'success');
        }
        setConfirmDialog(null);
      }
    });
  };

  return (
    <div className="p-6 space-y-6 dir-rtl text-right font-sans relative min-h-screen">
      
      {/* Background Decorative Blur Spheres */}
      <div className="absolute top-10 right-1/4 w-[32rem] h-[32rem] bg-[#0F4C81]/5 rounded-full filter blur-[120px] -z-10 pointer-events-none animate-pulse" />
      <div className="absolute bottom-20 left-10 w-[24rem] h-[24rem] bg-[#F7941D]/5 rounded-full filter blur-[100px] -z-10 pointer-events-none" />

      {/* Top Banner & Title */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 justify-end lg:justify-start">
            <span className="px-2.5 py-1 bg-[#0F4C81]/10 text-[#0F4C81] rounded-lg text-[10px] font-black border border-[#0F4C81]/20 shadow-3xs">لوحة تحكم الدليل المحاسبي</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">شجرة الحسابات والدليل المحاسبي</h1>
          </div>
          <p className="text-slate-500 mt-2 text-xs font-bold leading-relaxed">
            هيكلة وتصنيف الحسابات المالية لشركة إيجيبت كرينز والأصول الثابتة كالأوناش والرافعات والرواتب والمصاريف التشغيلية.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 justify-end">
          <button 
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white transition-all rounded-xl text-xs font-black shadow-md hover:shadow-lg hover:scale-[1.01] cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>استيراد الحسابات جماعياً (CSV/Excel)</span>
          </button>
          <button 
            onClick={() => handleOpenAdd(rootAccount)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F4C81] hover:bg-[#0F4C81]/90 text-white transition-all rounded-xl text-xs font-black shadow-md hover:shadow-lg hover:scale-[1.01] cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>إضافة حساب رئيسي جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards (Frosted Glassmorphism) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* 1. Total Accounts */}
        <div className="bg-white/40 backdrop-blur-md border border-white/60 p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(15,76,129,0.02)] hover:shadow-[0_12px_40px_rgba(15,76,129,0.06)] transition-all duration-300 flex flex-col justify-between hover:scale-[1.01]">
          <div className="flex justify-between items-start text-right">
            <div className="p-3 bg-blue-50 text-[#0F4C81] border border-blue-100 rounded-xl shadow-3xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">الحسابات المسجلة</span>
              <span className="text-xs text-slate-400 font-bold block mt-0.5">شاملة الحسابات الرئيسية والفرعية</span>
            </div>
          </div>
          <div className="mt-4 text-right">
            <span className="font-mono text-lg font-black text-[#0F4C81] block">
              {stats.totalNodes} حساباً مالياً
            </span>
          </div>
        </div>

        {/* 2. Assets roll-up */}
        <div className="bg-white/40 backdrop-blur-md border border-white/60 p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(15,76,129,0.02)] hover:shadow-[0_12px_40px_rgba(15,76,129,0.06)] transition-all duration-300 flex flex-col justify-between hover:scale-[1.01]">
          <div className="flex justify-between items-start text-right">
            <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl shadow-3xs">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">إجمالي الأصول المقيدة</span>
              <span className="text-xs text-slate-400 font-bold block mt-0.5">أصول ثابتة ومتداولة</span>
            </div>
          </div>
          <div className="mt-4 text-right">
            <span className="font-mono text-lg font-black text-emerald-600 block">
              {stats.assetsSum.toLocaleString('ar-EG')} ج.م
            </span>
          </div>
        </div>

        {/* 3. Liabilities roll-up */}
        <div className="bg-white/40 backdrop-blur-md border border-white/60 p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(15,76,129,0.02)] hover:shadow-[0_12px_40px_rgba(15,76,129,0.06)] transition-all duration-300 flex flex-col justify-between hover:scale-[1.01]">
          <div className="flex justify-between items-start text-right">
            <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl shadow-3xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">الخصوم والالتزامات</span>
              <span className="text-xs text-slate-400 font-bold block mt-0.5">التزامات الموردين والضرائب</span>
            </div>
          </div>
          <div className="mt-4 text-right">
            <span className="font-mono text-lg font-black text-rose-600 block">
              {stats.liabilitiesSum.toLocaleString('ar-EG')} ج.م
            </span>
          </div>
        </div>

        {/* 4. Equity roll-up */}
        <div className="bg-white/40 backdrop-blur-md border border-white/60 p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(15,76,129,0.02)] hover:shadow-[0_12px_40px_rgba(15,76,129,0.06)] transition-all duration-300 flex flex-col justify-between hover:scale-[1.01] bg-gradient-to-br from-white/30 to-indigo-50/10">
          <div className="flex justify-between items-start text-right">
            <div className="p-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl shadow-3xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">حقوق الملكية ورأس المال</span>
              <span className="text-xs text-slate-400 font-bold block mt-0.5">رأس المال المدفوع والاحتياطي</span>
            </div>
          </div>
          <div className="mt-4 text-right">
            <span className="font-mono text-lg font-black text-indigo-600 block">
              {stats.equitySum.toLocaleString('ar-EG')} ج.م
            </span>
          </div>
        </div>

      </div>

      {/* Main Filter & Action Dashboard controls */}
      <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(15,76,129,0.02)] p-5 rounded-2xl flex flex-col lg:flex-row gap-4 items-center justify-between">
        
        {/* Account Classification Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-100/50 p-1.5 rounded-xl w-full lg:w-auto">
          <button
            onClick={() => setSelectedTypeFilter('all')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              selectedTypeFilter === 'all' 
                ? 'bg-[#0F4C81] text-white shadow-sm' 
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setSelectedTypeFilter('assets')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              selectedTypeFilter === 'assets' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            الأصول
          </button>
          <button
            onClick={() => setSelectedTypeFilter('liabilities')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              selectedTypeFilter === 'liabilities' 
                ? 'bg-rose-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            الخصوم
          </button>
          <button
            onClick={() => setSelectedTypeFilter('equity')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              selectedTypeFilter === 'equity' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            حقوق الملكية
          </button>
          <button
            onClick={() => setSelectedTypeFilter('revenues')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              selectedTypeFilter === 'revenues' 
                ? 'bg-[#0F4C81] text-white shadow-sm' 
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            الإيرادات
          </button>
          <button
            onClick={() => setSelectedTypeFilter('expenses')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              selectedTypeFilter === 'expenses' 
                ? 'bg-amber-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            المصروفات
          </button>
        </div>

        {/* Search Input Filter */}
        <div className="relative w-full lg:w-96">
          <input 
            type="text" 
            placeholder="البحث في الدليل بالاسم أو برمز الحساب المالي..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-white/50 backdrop-blur-xs border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:bg-white transition-all"
          />
          <Search className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
        </div>

      </div>

      {/* Main Interactive Tree Card */}
      <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(15,76,129,0.02)] rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-white/40 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-right">
            <h3 className="font-extrabold text-sm text-slate-800">هيكل شجرة الحسابات التفاعلي</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-1">تتبع الحسابات والتدفقات، انقر لإضافة حساب فرعي، تعديل البيانات أو الحذف المحاسبي المتوازن.</p>
          </div>
          <div className="px-3.5 py-1.5 bg-[#0F4C81]/5 border border-[#0F4C81]/10 rounded-full text-[10px] text-[#0F4C81] font-black text-center flex items-center gap-1.5 justify-center shadow-3xs">
            <ListCollapse className="w-3.5 h-3.5" />
            <span>الدليل مبوب وموازن تلقائياً</span>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[620px] bg-white/10">
          <TreeNode 
            node={rootAccount} 
            onAddAccount={handleOpenAdd} 
            onEditAccount={handleOpenEdit}
            onDeleteAccount={handleDeleteAccount}
            searchQuery={search} 
            selectedTypeFilter={selectedTypeFilter}
          />
        </div>
      </div>

      {/* MODAL: Add Sub-Account */}
      <AnimatePresence>
        {showAddModal && selectedParent && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden text-right"
            >
              <div className="bg-[#0F4C81] p-5 text-white flex items-center justify-between">
                <h3 className="font-black text-sm">إضافة حساب فرعي جديد</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-white font-black text-lg cursor-pointer"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleAddAccount} className="p-6 space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] leading-relaxed">
                  <span className="text-slate-400 font-bold block">الحساب الرئيسي الأعلى المقيد تحته الحساب الجديد:</span>
                  <span className="font-extrabold text-[#0F4C81] block mt-1">{selectedParent.nameAr} ({selectedParent.code})</span>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 mb-1.5">رمز الحساب الجديد (مبني تلقائياً)</label>
                  <input 
                    type="text" 
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 mb-1.5">اسم الحساب الجديد بالكامل (بالعربية)</label>
                  <input 
                    type="text" 
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="مثال: ذمم ونش Liebherr LTM 1500"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 mb-1.5">الرصيد الافتتاحي أو الأساسي (ج.م)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      required
                      value={newBalance}
                      onChange={(e) => setNewBalance(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:bg-white transition-all"
                    />
                    <span className="absolute left-3.5 top-3 text-slate-400 font-mono text-[10px] font-black">ج.م</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 mb-1.5">تصنيف الحساب المالي</label>
                  <select 
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:bg-white transition-all text-right"
                  >
                    <option value="assets">الأصول (Assets)</option>
                    <option value="liabilities">الخصوم (Liabilities)</option>
                    <option value="equity">حقوق الملكية (Equity)</option>
                    <option value="revenues">الإيرادات (Revenues)</option>
                    <option value="expenses">المصروفات (Expenses)</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <button 
                    type="submit"
                    className="flex-1 py-3 px-4 bg-[#0F4C81] text-white text-xs font-bold rounded-xl hover:bg-[#0c3d67] transition-all cursor-pointer shadow-sm"
                  >
                    إضافة الحساب
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Edit Account */}
      <AnimatePresence>
        {showEditModal && selectedEditNode && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden text-right"
            >
              <div className="bg-[#0F4C81] p-5 text-white flex items-center justify-between">
                <h3 className="font-black text-sm">تعديل بيانات الحساب المحدد</h3>
                <button 
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEditNode(null);
                  }}
                  className="p-1 hover:bg-white/10 rounded-lg text-white font-black text-lg cursor-pointer"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleEditAccount} className="p-6 space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] leading-relaxed">
                  <span className="text-slate-400 font-bold block">تعديل بيانات الحساب:</span>
                  <span className="font-extrabold text-[#0F4C81] block mt-1">{selectedEditNode.nameAr} ({selectedEditNode.code})</span>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 mb-1.5">رمز الحساب (Code)</label>
                  <input 
                    type="text" 
                    required
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 mb-1.5">اسم الحساب بالكامل (بالعربية)</label>
                  <input 
                    type="text" 
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 mb-1.5">الرصيد المالي المقيد (ج.م)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      required
                      value={editBalance}
                      onChange={(e) => setEditBalance(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:bg-white transition-all"
                    />
                    <span className="absolute left-3.5 top-3 text-slate-400 font-mono text-[10px] font-black">ج.م</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 mb-1.5">نوع الحساب المالي ورتبته</label>
                  <select 
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:bg-white transition-all text-right"
                  >
                    <option value="assets">الأصول (Assets)</option>
                    <option value="liabilities">الخصوم (Liabilities)</option>
                    <option value="equity">حقوق الملكية (Equity)</option>
                    <option value="revenues">الإيرادات (Revenues)</option>
                    <option value="expenses">المصروفات (Expenses)</option>
                  </select>
                  <p className="text-[9px] text-slate-400 mt-1 font-bold">تغيير رتبة الحساب الرئيسي يغير تلقائياً كافة الحسابات الفرعية التابعة له.</p>
                </div>

                <div className="flex gap-2 pt-4">
                  <button 
                    type="submit"
                    className="flex-1 py-3 px-4 bg-[#0F4C81] text-white text-xs font-bold rounded-xl hover:bg-[#0c3d67] transition-all cursor-pointer shadow-sm"
                  >
                    حفظ التعديلات
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedEditNode(null);
                    }}
                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION OVERLAY */}
      <AnimatePresence>
        {confirmDialog && confirmDialog.isOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-slate-100 overflow-hidden text-right p-6 space-y-4"
            >
              <div className="flex items-center gap-2 justify-end text-rose-600">
                <span className="text-xs font-black text-slate-800">تأكيد عملية حذف الحساب المالي</span>
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <p className="text-[11px] text-slate-600 font-extrabold leading-relaxed">{confirmDialog.message}</p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  نعم، حذف وتعديل الرصيد
                </button>
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء الأمر
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📥 معالج استيراد الدليل المحاسبي جماعياً Chart of Accounts Bulk Import Modal */}
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
                  <h3 className="text-base font-black text-slate-800">معالج استيراد شجرة الحسابات (CSV / Excel)</h3>
                  <p className="text-[11px] text-slate-400 font-bold">استيراد جماعي للأصول، الخصوم، الإيرادات والمصاريف وتوزيعها في الهيكل المحاسبي تلقائياً</p>
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
                <span>رفع ملف الحسابات (.csv / .xlsx)</span>
              </div>
              <div className={`flex items-center gap-2 ${importStep === 2 ? 'text-[#0F4C81]' : ''}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${importStep === 2 ? 'bg-[#0F4C81] text-white' : 'bg-slate-200 text-slate-600'}`}>٢</span>
                <span>مطابقة الأعمدة والمعاينة</span>
              </div>
              <div className={`flex items-center gap-2 ${importStep === 3 ? 'text-[#0F4C81]' : ''}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${importStep === 3 ? 'bg-[#0F4C81] text-white' : 'bg-slate-200 text-slate-600'}`}>٣</span>
                <span>بناء الشجرة والموازنة</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {importStep === 1 && (
                <div className="space-y-6">
                  {/* Instructions banner */}
                  <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl space-y-2 text-xs">
                    <span className="font-extrabold text-[#0F4C81] block">💡 إرشادات استيراد الدليل المحاسبي:</span>
                    <ul className="text-slate-600 leading-relaxed font-semibold list-disc list-inside space-y-1">
                      <li>يفضل ترتيب الحسابات تصاعدياً بالرموز (من الحسابات الرئيسية إلى الفرعية).</li>
                      <li>إذا لم يتم تحديد "كود الأب" بالملف، سيقوم النظام تلقائياً باستنتاج الحساب الأب بناء على بنية الرموز (مثال الحساب <span className="text-[#0F4C81] font-mono font-bold">1.1.01.0003</span> سيكون أبوه تلقائياً هو الحساب <span className="text-[#0F4C81] font-mono font-bold">1.1.01</span>).</li>
                      <li>الحقول الأساسية المطلوبة: <span className="text-[#0F4C81] font-mono">كود الحساب*</span> و <span className="text-[#0F4C81] font-mono">اسم الحساب*</span>.</li>
                    </ul>
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
                      id="coa-import-file" 
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden" 
                    />
                    <label 
                      htmlFor="coa-import-file" 
                      className="cursor-pointer flex flex-col items-center gap-3"
                    >
                      <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 shadow-3xs">
                        <UploadCloud className="w-7 h-7" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-slate-700 block">اسحب وأفلت ملف الدليل المحاسبي هنا أو انقر للتصفح</span>
                        <span className="text-[11px] text-slate-400 font-bold mt-1 block">الصيغ المدعومة: CSV, Microsoft Excel (.xlsx, .xls)</span>
                      </div>
                    </label>
                  </div>

                  {/* Demo data integration */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 border rounded-2xl">
                    <div>
                      <span className="text-xs font-black text-slate-700 block">هل تريد تجربة الاستيراد فوراً؟</span>
                      <span className="text-[10px] text-slate-400 font-bold">انقر على الزر الجانبي لتحميل نموذج محاسبي لشركة مقاولات يضم بنوكاً ومصاريف تشغيلية للأوناش للتجربة.</span>
                    </div>
                    <button 
                      onClick={loadMockImportData}
                      className="px-4 py-2 bg-[#0F4C81]/10 hover:bg-[#0F4C81]/20 text-[#0F4C81] text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Database className="w-4 h-4 text-[#F7941D]" />
                      <span>تحميل حسابات تجريبية فوراً</span>
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
                      تم العثور على {fileRows.length} حقل/حساب جاهز للفرز
                    </span>
                  </div>

                  {/* Column Mapping Section */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-800 border-r-2 border-[#0F4C81] pr-2.5">مطابقة أعمدة الدليل المحاسبي مع النظام</h4>
                    <p className="text-[11px] text-slate-400 font-bold">طابق مسميات أعمدة ملفك المرفوع مع عناصر شجرة الحسابات للحفظ السليم:</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-50/50 p-4 border rounded-xl text-xs">
                      {Object.keys(columnMapping).map((key) => {
                        const dbFieldLabels: Record<string, string> = {
                          code: 'كود الحساب (*)',
                          nameAr: 'اسم الحساب (*)',
                          balance: 'الرصيد الافتتاحي',
                          type: 'نوع الحساب',
                          parentCode: 'كود الحساب الرئيسي (الأب)'
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

                  {/* Validation Preview */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-800 border-r-2 border-emerald-600 pr-2.5">معاينة الحسابات الجديدة والتحقق من صحتها</h4>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        الحسابات الصالحة للاستيراد: {importedAccounts.filter(a => a.isValid).length} من {importedAccounts.length}
                      </span>
                    </div>

                    <div className="border rounded-xl overflow-hidden shadow-xs">
                      <div className="overflow-x-auto max-h-[240px]">
                        <table className="w-full text-right border-collapse text-[11px] text-slate-600">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold sticky top-0">
                              <th className="py-2.5 px-3">التحقق</th>
                              <th className="py-2.5 px-3">كود الحساب</th>
                              <th className="py-2.5 px-3">اسم الحساب</th>
                              <th className="py-2.5 px-3">نوع الحساب</th>
                              <th className="py-2.5 px-3">الرصيد الافتتاحي</th>
                              <th className="py-2.5 px-3">الحساب الأب المقترح</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {importedAccounts.map((row, idx) => {
                              const typeLabels: Record<string, string> = {
                                assets: 'أصول',
                                liabilities: 'خصوم / التزامات',
                                equity: 'حقوق ملكية',
                                revenues: 'إيرادات',
                                expenses: 'مصروفات تشغيلية'
                              };

                              return (
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
                                  <td className="py-2 px-3 font-mono font-bold text-slate-800">{row.item.code}</td>
                                  <td className="py-2 px-3 font-bold text-slate-700">{row.item.nameAr || <span className="text-rose-400">فارغ *</span>}</td>
                                  <td className="py-2 px-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      row.item.type === 'assets' ? 'bg-blue-50 text-blue-700' :
                                      row.item.type === 'liabilities' ? 'bg-amber-50 text-amber-700' :
                                      row.item.type === 'expenses' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                                    }`}>
                                      {typeLabels[row.item.type]}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 font-mono font-bold text-slate-700">{row.item.balance.toLocaleString()} ج.م</td>
                                  <td className="py-2 px-3 font-mono text-slate-400">{row.parentCode}</td>
                                </tr>
                              );
                            })}
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
                    disabled={importedAccounts.filter(a => a.isValid).length === 0}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-900/10"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد البناء والدمج للشجرة ({importedAccounts.filter(a => a.isValid).length} حساب)</span>
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

      {/* FLOATING SUCCESS/ERROR NOTIFICATION OVERLAY */}
      <AnimatePresence>
        {notification && (
          <div className="fixed bottom-6 right-6 z-[120]">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className={`flex items-center gap-3 px-4.5 py-3 rounded-xl shadow-lg border text-xs font-extrabold text-right ${
                notification.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : notification.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <span>{notification.message}</span>
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600" />
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
