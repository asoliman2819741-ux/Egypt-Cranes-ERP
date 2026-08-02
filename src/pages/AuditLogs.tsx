import React, { useState, useMemo, useEffect } from 'react';
import { encryptData, decryptData } from '../utils/backupSecurity';
import { 
  Search, Filter, ShieldAlert, ShieldCheck, Clock, CheckCircle2, 
  XCircle, FileSpreadsheet, Eye, Download, Calendar, RefreshCw, 
  AlertTriangle, User, Key, Database, Globe, Play, X, Trash2
} from 'lucide-react';
import { AuditLog } from '../types';

// Seed initial highly-realistic audit logs
const initialAuditLogs: AuditLog[] = [
  { 
    id: 'LOG-2026-7712', 
    timestamp: '2026-07-11 09:42:15', 
    userName: 'أشرف سليمان', 
    userRole: 'مدير النظام', 
    ipAddress: '192.168.1.100', 
    actionType: 'security_change', 
    severity: 'critical', 
    module: 'المستخدمين والصلاحيات', 
    description: 'تعديل الصلاحيات الأمنية لمجموعة المحاسبين وتفعيل ميزة التوقيع الثنائي للهواتف',
    details: '{\n  "action": "UPDATE_SECURITY_POLICY",\n  "target_group": "Finance Team",\n  "mfa_status": "enforced",\n  "authorized_by": "أشرف سليمان",\n  "timestamp_utc": "2026-07-11T09:42:15Z"\n}'
  },
  { 
    id: 'LOG-2026-7713', 
    timestamp: '2026-07-11 08:30:00', 
    userName: 'سامح سمير', 
    userRole: 'مسؤول بوابة', 
    ipAddress: '192.168.10.15', 
    actionType: 'create', 
    severity: 'info', 
    module: 'بوابة الأمن والحركة', 
    description: 'إصدار تصريح خروج بوابة رقم GP-2026-089 لونش ديمباج EC-CR-250',
    details: '{\n  "gate_pass_no": "GP-2026-089",\n  "crane_code": "EC-CR-250",\n  "driver_name": "كابتن محمود الجارحي",\n  "inspected_items": ["كابلات الشد", "الخطاف الرئيسي", "طفاية الحريق"],\n  "gate_officer": "سامح سمير"\n}'
  },
  { 
    id: 'LOG-2026-7714', 
    timestamp: '2026-07-11 07:15:22', 
    userName: 'محمد خليل', 
    userRole: 'المدير المالي التنفيذي', 
    ipAddress: '192.168.2.5', 
    actionType: 'approval', 
    severity: 'info', 
    module: 'القيود اليومية', 
    description: 'اعتماد وترحيل قيد اليومية رقم JV-2026-004 لموقع العاصمة الإدارية',
    details: '{\n  "journal_id": "JV-2026-004",\n  "total_amount": 1200000,\n  "currency": "EGP",\n  "accounts": [\n    {"account": "حسابات العملاء - أوراسكوم", "debit": 1200000},\n    {"account": "نقدية بالبنك التجاري الدولي CIB", "credit": 1200000}\n  ]\n}'
  },
  { 
    id: 'LOG-2026-7715', 
    timestamp: '2026-07-10 16:45:10', 
    userName: 'نوران عادل', 
    userRole: 'موارد بشرية', 
    ipAddress: '192.168.4.11', 
    actionType: 'update', 
    severity: 'info', 
    module: 'شؤون الموظفين', 
    description: 'تعديل رصيد الإجازات السنوية للموظف كابتن محمود الجارحي من 14 إلى 12 يوماً',
    details: '{\n  "employee_id": "emp-102",\n  "employee_name": "محمود الجارحي",\n  "prev_balance": 14,\n  "new_balance": 12,\n  "deduction_reason": "استهلاك إجازة اعتيادية عارضة"\n}'
  },
  { 
    id: 'LOG-2026-7716', 
    timestamp: '2026-07-10 14:22:18', 
    userName: 'أشرف سليمان', 
    userRole: 'مدير النظام', 
    ipAddress: '192.168.1.100', 
    actionType: 'login', 
    severity: 'info', 
    module: 'المصادقة والأمان', 
    description: 'تسجيل دخول ناجح للنظام للبريد الإلكتروني: asoliman@egyptcranes.com',
    details: '{\n  "user_id": "1",\n  "username": "admin",\n  "auth_method": "password + OTP",\n  "session_token_expiry": "12_hours"\n}'
  },
  { 
    id: 'LOG-2026-7717', 
    timestamp: '2026-07-10 11:10:05', 
    userName: 'ياسر حسن', 
    userRole: 'مهندس صيانة', 
    ipAddress: '192.168.3.14', 
    actionType: 'create', 
    severity: 'warning', 
    module: 'الصيانة والتشغيل', 
    description: 'تسجيل أمر صيانة طارئة لونش ليبهير LTM 1100 رقم WO-2026-114',
    details: '{\n  "work_order_no": "WO-2026-114",\n  "crane_code": "EC-CR-100",\n  "defect_discovered": "تسريب زيت في المبرد الهيدروليكي للذراع التلسكوبي",\n  "urgency": "high",\n  "allocated_budget_est": 45000\n}'
  },
  { 
    id: 'LOG-2026-7718', 
    timestamp: '2026-07-09 15:30:12', 
    userName: 'مجهول IP: 197.34.120.45', 
    userRole: 'محاولة وصول خارجي', 
    ipAddress: '197.34.120.45', 
    actionType: 'login', 
    severity: 'critical', 
    module: 'المصادقة والأمان', 
    description: 'محاولة تسجيل دخول فاشلة متكررة بحساب m.khalil برقم مرور غير صحيح',
    details: '{\n  "attempted_username": "m.khalil",\n  "failed_attempts": 3,\n  "action_taken": "IP block temporary for 15 minutes",\n  "country_origin": "EG"\n}'
  },
  { 
    id: 'LOG-2026-7719', 
    timestamp: '2026-07-09 12:45:00', 
    userName: 'محمد خليل', 
    userRole: 'المدير المالي التنفيذي', 
    ipAddress: '192.168.2.5', 
    actionType: 'export', 
    severity: 'warning', 
    module: 'التقارير المالية', 
    description: 'تصدير القوائم المالية الموحدة وحساب الأرباح والخسائر للربع الثاني لعام ٢٠٢٦ بصيغة Excel',
    details: '{\n  "report_type": "PROFIT_LOSS_STMT",\n  "period": "Q2-2026",\n  "records_exported": 1420,\n  "download_token": "dl_token_8849c28e8"\n}'
  },
  { 
    id: 'LOG-2026-7720', 
    timestamp: '2026-07-09 10:15:30', 
    userName: 'أشرف سليمان', 
    userRole: 'مدير النظام', 
    ipAddress: '192.168.1.100', 
    actionType: 'delete', 
    severity: 'critical', 
    module: 'العقود والارتباطات', 
    description: 'إلغاء وحذف مسودة عقد تشغيل رقم EC-CT-992 لعدم توفر الملاءة المالية للعميل',
    details: '{\n  "deleted_contract_id": "EC-CT-992",\n  "customer_name": "المعادي للمقاولات والمحاجر",\n  "estimated_contract_value": 3200000,\n  "justification": "خطاب عدم جدية من البنك وضياع الفرصة البديلة"\n}'
  },
  { 
    id: 'LOG-2026-7721', 
    timestamp: '2026-07-08 11:22:19', 
    userName: 'نوران عادل', 
    userRole: 'موارد بشرية', 
    ipAddress: '192.168.4.11', 
    actionType: 'create', 
    severity: 'info', 
    module: 'شؤون الموظفين', 
    description: 'إنشاء كرت الموظف الجديد بقاعدة البيانات: كابتن توفيق النبوي',
    details: '{\n  "new_employee": "توفيق النبوي",\n  "role": "سائق ونش جنزير ليبهير LR 1600/2",\n  "allocated_salary": 14500,\n  "hire_date": "2026-07-08"\n}'
  },
  { 
    id: 'LOG-2026-7722', 
    timestamp: '2026-07-08 09:12:44', 
    userName: 'أشرف سليمان', 
    userRole: 'مدير النظام', 
    ipAddress: '192.168.1.100', 
    actionType: 'security_change', 
    severity: 'critical', 
    module: 'حدود الاعتماد والتراخيص', 
    description: 'تعديل سقف صلاحية الاعتماد المالي الفوري للأستاذ محمد خليل إلى ١,٥٠٠,٠٠٠ ج.م',
    details: '{\n  "authority_id": "auth-2",\n  "user": "محمد خليل",\n  "previous_limit": 1000000,\n  "new_limit": 1500000,\n  "approval_status": "enacted_directly"\n}'
  }
];

export default function AuditLogs({
  currentDatabase,
  onRestoreDatabase
}: {
  currentDatabase?: any;
  onRestoreDatabase?: (newDb: any) => void;
}) {
  const [logs, setLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('egypt_cranes_audit_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialAuditLogs;
      }
    }
    return initialAuditLogs;
  });

  // Keep logs synchronized with localStorage
  useEffect(() => {
    localStorage.setItem('egypt_cranes_audit_logs', JSON.stringify(logs));
  }, [logs]);

  const [activeTab, setActiveTab] = useState<'logs' | 'backup'>('logs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // States for Security and Backup Center
  const [exportPasscode, setExportPasscode] = useState('');
  const [importPasscode, setImportPasscode] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [exportSuccess, setExportSuccess] = useState('');
  const [autoBackups, setAutoBackups] = useState<any[]>([]);
  
  // States for Simulator Component
  const [simActor, setSimActor] = useState('أشرف سليمان');
  const [simModule, setSimModule] = useState('القيود اليومية');
  const [simActionType, setSimActionType] = useState<'create' | 'update' | 'delete' | 'login' | 'approval' | 'export' | 'security_change'>('update');
  const [simSeverity, setSimSeverity] = useState<'info' | 'warning' | 'critical'>('info');
  const [simDescription, setSimDescription] = useState('');

  // Dropdown options lists
  const actionTypes = [
    { value: 'create', label: 'إضافة (Create)' },
    { value: 'update', label: 'تحديث (Update)' },
    { value: 'delete', label: 'حذف (Delete)' },
    { value: 'login', label: 'تسجيل دخول (Login)' },
    { value: 'logout', label: 'تسجيل خروج (Logout)' },
    { value: 'approval', label: 'اعتماد (Approval)' },
    { value: 'export', label: 'تصدير بيانات (Export)' },
    { value: 'security_change', label: 'تعديل أمني (Security)' }
  ];

  const severities = [
    { value: 'info', label: 'اعتيادي (Info)', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'warning', label: 'تحذيري (Warning)', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { value: 'critical', label: 'حرج (Critical)', color: 'bg-rose-50 text-rose-700 border-rose-200' }
  ];

  const modules = [
    'المصادقة والأمان',
    'بوابة الأمن والحركة',
    'القيود اليومية',
    'شؤون الموظفين',
    'الصيانة والتشغيل',
    'التقارير المالية',
    'العقود والارتباطات',
    'المستندات والعقود',
    'حدود الاعتماد والتراخيص',
    'المستخدمين والصلاحيات'
  ];

  // Filtering Logic
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.ipAddress.includes(searchQuery) ||
        log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesAction = selectedActionType === 'all' || log.actionType === selectedActionType;
      const matchesSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;
      const matchesModule = selectedModule === 'all' || log.module === selectedModule;

      return matchesSearch && matchesAction && matchesSeverity && matchesModule;
    });
  }, [logs, searchQuery, selectedActionType, selectedSeverity, selectedModule]);

  // Statistics Computations
  const stats = useMemo(() => {
    const total = logs.length;
    const critical = logs.filter(l => l.severity === 'critical').length;
    const warning = logs.filter(l => l.severity === 'warning').length;
    const security = logs.filter(l => l.actionType === 'security_change').length;
    return { total, critical, warning, security };
  }, [logs]);

  // Handle Simulate Log Addition
  const handleSimulateLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simDescription) {
      alert('الرجاء كتابة وصف للحدث المراد محاكاته.');
      return;
    }

    const rolesMap: { [key: string]: string } = {
      'أشرف سليمان': 'مدير النظام',
      'محمد خليل': 'المدير المالي التنفيذي',
      'ياسر حسن': 'مهندس صيانة رئيسي',
      'سامح سمير': 'مسؤول بوابة',
      'نوران عادل': 'موارد بشرية',
      'رأفت أبو سريع': 'كابتن تشغيلي'
    };

    const ipsMap: { [key: string]: string } = {
      'أشرف سليمان': '192.168.1.100',
      'محمد خليل': '192.168.2.5',
      'ياسر حسن': '192.168.3.14',
      'سامح سمير': '192.168.10.15',
      'نوران عادل': '192.168.4.11',
      'رأفت أبو سريع': '192.168.10.22'
    };

    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);

    const simulatedDetails = JSON.stringify({
      simulated_event: true,
      actor_name: simActor,
      actor_role: rolesMap[simActor] || 'كادر معتمد',
      triggered_action: simActionType.toUpperCase(),
      target_module: simModule,
      ip_route: ipsMap[simActor] || '192.168.1.55',
      client_agent: "Mozilla/5.0 (ERP Egypt Cranes Portal)"
    }, null, 2);

    const newLog: AuditLog = {
      id: `LOG-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: dateStr,
      userName: simActor,
      userRole: rolesMap[simActor] || 'كادر معتمد',
      ipAddress: ipsMap[simActor] || '192.168.1.55',
      actionType: simActionType,
      severity: simSeverity,
      module: simModule,
      description: simDescription,
      details: simulatedDetails
    };

    setLogs([newLog, ...logs]);
    setSelectedLog(newLog); // Auto open details drawer for the simulated log
    setSimDescription(''); // Reset form field
  };

  // Load auto backups on tab change or mount
  useEffect(() => {
    const saved = localStorage.getItem('egypt_cranes_auto_backups');
    if (saved) {
      try {
        setAutoBackups(JSON.parse(saved));
      } catch (e) {
        setAutoBackups([]);
      }
    }
  }, [activeTab]);

  const handleRestoreAutoBackup = (backup: any) => {
    if (!onRestoreDatabase) return;
    if (window.confirm(`هل أنت متأكد من رغبتك في استعادة النظام بالكامل إلى حالة النسخة الاحتياطية (${backup.id}) المؤرشفة بتاريخ ${backup.timestamp}؟ ستفقد أي تغييرات غير محفوظة منذ ذلك الحين.`)) {
      onRestoreDatabase(backup.database);
      
      const newRestoreLog = {
        id: `LOG-RES-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userName: 'أشرف سليمان',
        userRole: 'مدير النظام',
        ipAddress: '192.168.1.100',
        actionType: 'security_change',
        severity: 'critical',
        module: 'المصادقة والأمان',
        description: `تمت استعادة كامل بيانات النظام بنجاح من نقطة استرجاع تلقائية محلية. معرف النسخة: ${backup.id}`,
        details: JSON.stringify({
          restored_backup_id: backup.id,
          restored_by: 'أشرف سليمان',
          timestamp_utc: new Date().toISOString(),
          size: backup.size
        }, null, 2)
      };
      setLogs(prev => [newRestoreLog, ...prev]);
      alert('تمت استعادة قاعدة بيانات النظام بنجاح وتحديث كافة التقارير والحسابات في الخلفية!');
    }
  };

  const handleDeleteAutoBackup = (backupId: string) => {
    const updated = autoBackups.filter(b => b.id !== backupId);
    localStorage.setItem('egypt_cranes_auto_backups', JSON.stringify(updated));
    setAutoBackups(updated);
    
    const newDeleteLog = {
      id: `LOG-DEL-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userName: 'أشرف سليمان',
      userRole: 'مدير النظام',
      ipAddress: '192.168.1.100',
      actionType: 'security_change',
      severity: 'warning',
      module: 'المستندات والعقود',
      description: `تم حذف ملف النسخ الاحتياطي التلقائي (${backupId}) من ذاكرة التخزين المحلية لتوفير مساحة.`,
      details: JSON.stringify({ deleted_id: backupId, deleted_by: 'أشرف سليمان' }, null, 2)
    };
    setLogs(prev => [newDeleteLog, ...prev]);
  };

  const handleCreateManualBackup = () => {
    if (!currentDatabase) return;
    
    const dbStr = JSON.stringify(currentDatabase);
    const newBackup = {
      id: `BK-MAN-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: 'manual',
      size: dbStr.length,
      database: currentDatabase
    };
    
    const updated = [newBackup, ...autoBackups];
    localStorage.setItem('egypt_cranes_auto_backups', JSON.stringify(updated));
    setAutoBackups(updated);
    
    const newBackupLog = {
      id: `LOG-BK-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userName: 'أشرف سليمان',
      userRole: 'مدير النظام',
      ipAddress: '192.168.1.100',
      actionType: 'security_change',
      severity: 'info',
      module: 'المستندات والعقود',
      description: `تم إجراء نقطة استرجاع فورية يدوية بنجاح بواسطة أشرف سليمان. معرف النسخة: ${newBackup.id}`,
      details: JSON.stringify({ backup_id: newBackup.id, initiated_by: 'أشرف سليمان' }, null, 2)
    };
    setLogs(prev => [newBackupLog, ...prev]);
    setExportSuccess('تم إنشاء نقطة استرجاع فورية يدوية وحفظها في الأرشيف بنجاح!');
    setTimeout(() => setExportSuccess(''), 4000);
  };

  const handleExportEncryptedFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportPasscode) {
      alert('الرجاء كتابة كلمة مرور لتشفير الملف أولاً!');
      return;
    }
    if (exportPasscode.length < 4) {
      alert('الرجاء استخدام كلمة مرور قوية مكونة من ٤ رموز على الأقل!');
      return;
    }
    
    try {
      const dbStr = JSON.stringify(currentDatabase);
      const encrypted = encryptData(dbStr, exportPasscode);
      
      const blob = new Blob([encrypted], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `EGYPT_CRANES_SECURE_DB_${new Date().toISOString().slice(0, 10)}.egc`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      const exportLog = {
        id: `LOG-EXP-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userName: 'أشرف سليمان',
        userRole: 'مدير النظام',
        ipAddress: '192.168.1.100',
        actionType: 'export',
        severity: 'warning',
        module: 'المصادقة والأمان',
        description: 'تصدير ملف قاعدة البيانات المشفر الكامل (.egc) وتأمين النظام ضد الاختراق.',
        details: JSON.stringify({
          event: "DATABASE_ENCRYPTED_EXPORT",
          operator: "أشرف سليمان",
          file_extension: ".egc",
          encryption_header: "EGYPT-CRANES-SECURE-BACKUP",
          passcode_hashed_len: exportPasscode.length
        }, null, 2)
      };
      setLogs(prev => [exportLog, ...prev]);
      
      setExportSuccess('تم تشفير وتصدير ملف قاعدة البيانات الكامل بنجاح!');
      setExportPasscode('');
      setTimeout(() => setExportSuccess(''), 4000);
    } catch (err: any) {
      alert(`فشل التصدير: ${err.message}`);
    }
  };

  const handleImportEncryptedFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      setImportError('الرجاء تحديد ملف النسخة الاحتياطية المشفر (.egc) أولاً!');
      return;
    }
    if (!importPasscode) {
      setImportError('الرجاء إدخال كلمة المرور الصحيحة لفك تشفير الملف!');
      return;
    }
    
    setImportError('');
    setImportSuccess('');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const encryptedStr = event.target?.result as string;
        if (!encryptedStr) {
          throw new Error('الملف فارغ أو غير مقروء.');
        }
        
        const decryptedStr = decryptData(encryptedStr, importPasscode);
        const parsedDb = JSON.parse(decryptedStr);
        
        if (!parsedDb.cranes || !parsedDb.journalEntries) {
          throw new Error('الملف لا يحتوي على بنية قاعدة بيانات صالحة لشركة مصر للأوناش.');
        }
        
        if (onRestoreDatabase) {
          onRestoreDatabase(parsedDb);
          
          const importLog = {
            id: `LOG-IMP-${Math.floor(1000 + Math.random() * 9000)}`,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            userName: 'أشرف سليمان',
            userRole: 'مدير النظام',
            ipAddress: '192.168.1.100',
            actionType: 'security_change',
            severity: 'critical',
            module: 'المصادقة والأمان',
            description: 'استيراد وفك تشفير كامل لقاعدة البيانات وإعادة تهيئة النظام بنجاح من ملف خارجي.',
            details: JSON.stringify({
              event: "DATABASE_ENCRYPTED_IMPORT",
              restored_by: "أشرف سليمان",
              restored_records_cranes: parsedDb.cranes.length,
              restored_records_journals: parsedDb.journalEntries.length,
              source_file: importFile.name
            }, null, 2)
          };
          setLogs(prev => [importLog, ...prev]);
          
          setImportSuccess('تم فك التشفير واستعادة كامل بيانات النظام بنجاح وتنشيط شاشات الرصد الفوري!');
          setImportFile(null);
          setImportPasscode('');
          setTimeout(() => setImportSuccess(''), 5000);
        }
      } catch (err: any) {
        setImportError(err.message || 'فشل فك التشفير والاستيراد. تأكد من صحة كلمة المرور وسلامة الملف.');
      }
    };
    
    reader.readAsText(importFile);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedActionType('all');
    setSelectedSeverity('all');
    setSelectedModule('all');
  };

  // Export Filtered Logs to Excel CSV
  const handleExportCSV = () => {
    const headers = 'معرف السجل,الوقت والتاريخ,المستخدم المسؤول,الدور الوظيفي,عنوان IP,نوع الإجراء,مستوى الخطورة,النظام المستهدف,الوصف العام\n';
    const rows = filteredLogs.map(l => 
      `"${l.id}","${l.timestamp}","${l.userName}","${l.userRole}","${l.ipAddress}","${l.actionType}","${l.severity}","${l.module}","${l.description.replace(/"/g, '""')}"`
    ).join('\n');

    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `EGYPT_CRANES_AUDIT_LOGS_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (type: string) => {
    const mapping: { [key: string]: { label: string, style: string } } = {
      'create': { label: 'إضافة جديدة', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      'update': { label: 'تعديل حقل', style: 'bg-blue-50 text-blue-700 border-blue-200' },
      'delete': { label: 'حذف سجل', style: 'bg-rose-50 text-rose-700 border-rose-200' },
      'login': { label: 'تسجيل دخول', style: 'bg-purple-50 text-purple-700 border-purple-200' },
      'logout': { label: 'تسجيل خروج', style: 'bg-slate-100 text-slate-700 border-slate-300' },
      'approval': { label: 'اعتماد إداري', style: 'bg-teal-50 text-teal-700 border-teal-200' },
      'export': { label: 'تصدير ملفات', style: 'bg-amber-50 text-amber-700 border-amber-200' },
      'security_change': { label: 'أمان وصلاحيات', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
    };
    const item = mapping[type] || { label: type, style: 'bg-slate-50 text-slate-700 border-slate-200' };
    return <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border ${item.style}`}>{item.label}</span>;
  };

  const getSeverityBadge = (severity: string) => {
    if (severity === 'critical') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-lg bg-red-50 text-red-700 border border-red-200 animate-pulse">
          <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
          <span>حرج جداً (Critical)</span>
        </span>
      );
    } else if (severity === 'warning') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>تحذيري (Warning)</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-50 text-slate-500 border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>اعتيادي (Info)</span>
        </span>
      );
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fadeIn text-right" dir="rtl">
      
      {/* 1. Header with Glassmorphic Breadcrumb & Title */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0F4C81] to-[#1e293b] text-white p-6 rounded-3xl shadow-lg border border-slate-700/30">
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#F7941D]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-black text-amber-400 mb-2">
              <span>بوابة الإدارة والأمن السيبراني</span>
              <span>•</span>
              <span>مركز المتابعة والرقابة</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">سجل الرقابة وتتبع العمليات والأمن (Audit Logs)</h1>
            <p className="text-xs text-slate-300 font-bold mt-1 leading-relaxed">
              رصد حي وموثق لكافة التغييرات، قيود اليومية، الصلاحيات الأمنية، وبصمات الحضور لضمان أعلى معايير الشفافية والتوافق القانوني في مصر للأوناش.
            </p>
          </div>

          <div className="flex gap-2.5 self-start md:self-center">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.01]"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>تصدير إلى Excel / CSV</span>
            </button>
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="إعادة ضبط الفلاتر"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-6 py-3.5 font-black text-xs transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'border-[#0F4C81] text-[#0F4C81]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>سجل تتبع العمليات والرقابة الفورية</span>
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-6 py-3.5 font-black text-xs transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'backup'
              ? 'border-[#0F4C81] text-[#0F4C81]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Database className="w-4 h-4 text-orange-500" />
          <span>مركز النسخ الاحتياطي التلقائي والتصدير المشفر</span>
        </button>
      </div>

      {activeTab === 'logs' ? (
        <>
          {/* 2. KPIs Analytics Grid (Glassmorphism) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Events */}
        <div className="bg-white/50 backdrop-blur-md border border-white/70 hover:bg-white/60 hover:scale-[1.01] transition-all rounded-2xl p-5 flex items-center justify-between shadow-[0_8px_32px_0_rgba(15,76,129,0.03)]">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold block">إجمالي الأحداث المسجلة</span>
            <p className="text-2xl font-black text-slate-800 font-mono">{stats.total} حدث</p>
            <span className="text-[9px] text-slate-500 font-extrabold bg-slate-100 border border-slate-200/40 px-2 py-0.5 rounded-full inline-block">
              تحديث تلقائي • خادم آمن
            </span>
          </div>
          <div className="p-3.5 bg-blue-50/80 text-[#0F4C81] rounded-2xl border border-blue-100/60 shadow-sm">
            <Database className="w-5 h-5" />
          </div>
        </div>

        {/* Critical Security Anomalies */}
        <div className="bg-white/50 backdrop-blur-md border border-white/70 hover:bg-white/60 hover:scale-[1.01] transition-all rounded-2xl p-5 flex items-center justify-between shadow-[0_8px_32px_0_rgba(15,76,129,0.03)]">
          <div className="space-y-1">
            <span className="text-[10px] text-rose-500 font-extrabold block">الأحداث الحرجة (Critical)</span>
            <p className="text-2xl font-black text-rose-600 font-mono">{stats.critical} تتبع</p>
            <span className="text-[9px] text-rose-600 font-extrabold bg-rose-50 border border-rose-100/50 px-2 py-0.5 rounded-full inline-block animate-pulse">
              يتطلب فحص فوري
            </span>
          </div>
          <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100/60 shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Warning Alerts */}
        <div className="bg-white/50 backdrop-blur-md border border-white/70 hover:bg-white/60 hover:scale-[1.01] transition-all rounded-2xl p-5 flex items-center justify-between shadow-[0_8px_32px_0_rgba(15,76,129,0.03)]">
          <div className="space-y-1">
            <span className="text-[10px] text-amber-500 font-extrabold block">تنبيهات تحذيرية (Warning)</span>
            <p className="text-2xl font-black text-amber-600 font-mono">{stats.warning} تنبيه</p>
            <span className="text-[9px] text-amber-600 font-extrabold bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded-full inline-block">
              تمت معالجتها ومراجعتها
            </span>
          </div>
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100/60 shadow-sm">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Security / Privilege Changes */}
        <div className="bg-white/50 backdrop-blur-md border border-white/70 hover:bg-white/60 hover:scale-[1.01] transition-all rounded-2xl p-5 flex items-center justify-between shadow-[0_8px_32px_0_rgba(15,76,129,0.03)]">
          <div className="space-y-1">
            <span className="text-[10px] text-indigo-500 font-extrabold block">تعديلات الصلاحيات والأمان</span>
            <p className="text-2xl font-black text-indigo-700 font-mono">{stats.security} تعديل</p>
            <span className="text-[9px] text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-full inline-block">
              مستوى أمان ثنائي نشط
            </span>
          </div>
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/60 shadow-sm">
            <Key className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 3. Main Multi-Search, Filter and Action Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Search & Filters Card (Left - 2 Columns wide in desktop) */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(15,76,129,0.02)] p-5 rounded-2xl space-y-4">
            
            {/* Search Input Bar */}
            <div className="relative">
              <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="ابحث برقم المعرف، اسم الموظف المسؤول، الكلمات المفتاحية، عنوان IP، أو الوصف..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-11 py-3 bg-white/70 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:bg-white transition-all shadow-3xs"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 left-3 flex items-center text-slate-400 hover:text-slate-600 font-bold"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Select Criteria Dropdowns (Three columns on wide screens) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              <div>
                <label className="block text-[10px] text-slate-500 font-black mb-1.5">حسب نوع الإجراء</label>
                <select
                  value={selectedActionType}
                  onChange={e => setSelectedActionType(e.target.value)}
                  className="w-full p-2.5 bg-white/70 border border-slate-200/80 rounded-lg text-xs font-black text-slate-700 cursor-pointer focus:ring-1 focus:ring-[#0F4C81] focus:outline-none"
                >
                  <option value="all">كل أنواع الإجراءات والعمليات</option>
                  {actionTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-black mb-1.5">حسب درجة الخطورة</label>
                <select
                  value={selectedSeverity}
                  onChange={e => setSelectedSeverity(e.target.value)}
                  className="w-full p-2.5 bg-white/70 border border-slate-200/80 rounded-lg text-xs font-black text-slate-700 cursor-pointer focus:ring-1 focus:ring-[#0F4C81] focus:outline-none"
                >
                  <option value="all">كل مستويات الخطورة والتحذير</option>
                  <option value="info">اعتيادي (Info)</option>
                  <option value="warning">تحذيري (Warning)</option>
                  <option value="critical">حرج (Critical)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-black mb-1.5">حسب النظام المستهدف (الموديول)</label>
                <select
                  value={selectedModule}
                  onChange={e => setSelectedModule(e.target.value)}
                  className="w-full p-2.5 bg-white/70 border border-slate-200/80 rounded-lg text-xs font-black text-slate-700 cursor-pointer focus:ring-1 focus:ring-[#0F4C81] focus:outline-none"
                >
                  <option value="all">كل الأقسام والموديولات</option>
                  {modules.map(mod => (
                    <option key={mod} value={mod}>{mod}</option>
                  ))}
                </select>
              </div>

            </div>

          </div>

          {/* Interactive Logs Table View (Glassmorphism) */}
          <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(15,76,129,0.02)] rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-white/40 bg-slate-100/30 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-xs text-slate-800">بيانات السجل العام للأمن والعمليات</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">مؤمن ضد التعديل أو التزوير التراكمي (Immutable ERP ledger)</p>
              </div>
              <span className="text-[10px] bg-white/80 border border-slate-200/40 text-[#0F4C81] px-3 py-1 rounded-full font-black shadow-3xs">
                الأحداث المصفاة: {filteredLogs.length} من {logs.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-100/50 text-slate-500 text-[10px] font-black border-b border-slate-200/40">
                    <th className="px-4 py-3">المعرف التاريخي</th>
                    <th className="px-3 py-3">الوقت والتاريخ</th>
                    <th className="px-4 py-3">المسؤول (Actor)</th>
                    <th className="px-3 py-3 text-center">نوع الإجراء</th>
                    <th className="px-3 py-3 text-center">الخطورة</th>
                    <th className="px-3 py-3">الموديول</th>
                    <th className="px-4 py-3">تفاصيل الإجراء والمتابعة</th>
                    <th className="px-4 py-3 text-center">خيارات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/30 text-xs font-semibold">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center text-slate-400 font-black bg-white/10">
                        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2.5 animate-bounce" />
                        <span>لا توجد سجلات تتبع مطابقة لخيارات الفلترة الحالية</span>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => (
                      <tr 
                        key={log.id} 
                        className={`hover:bg-white/50 transition-colors duration-150 cursor-pointer ${selectedLog?.id === log.id ? 'bg-blue-50/40 border-r-4 border-r-[#0F4C81]' : ''}`}
                        onClick={() => setSelectedLog(log)}
                      >
                        {/* ID Column */}
                        <td className="px-4 py-3.5 font-mono text-[10px] font-bold text-slate-500">
                          {log.id}
                        </td>

                        {/* Timestamp Column */}
                        <td className="px-3 py-3.5 font-mono text-[10px] text-slate-500 font-bold whitespace-nowrap">
                          {log.timestamp}
                        </td>

                        {/* User / Actor Column */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-700 shadow-3xs">
                              {log.userName[0]}
                            </div>
                            <div>
                              <p className="font-black text-slate-800 text-[11px]">{log.userName}</p>
                              <p className="text-[9px] text-slate-400 font-bold mt-0.5">{log.userRole}</p>
                            </div>
                          </div>
                        </td>

                        {/* Action Type Badge */}
                        <td className="px-3 py-3.5 text-center whitespace-nowrap">
                          {getActionBadge(log.actionType)}
                        </td>

                        {/* Severity Badge */}
                        <td className="px-3 py-3.5 text-center whitespace-nowrap">
                          {getSeverityBadge(log.severity)}
                        </td>

                        {/* Target System Module */}
                        <td className="px-3 py-3.5 text-slate-600 font-bold text-[10px]">
                          {log.module}
                        </td>

                        {/* Brief description */}
                        <td className="px-4 py-3.5 text-slate-600 max-w-[200px] truncate text-[11px] font-extrabold" title={log.description}>
                          {log.description}
                        </td>

                        {/* Action option */}
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className="p-1.5 hover:bg-slate-200/50 rounded-lg text-[#0F4C81] hover:text-[#0F4C81]/80 transition-colors"
                            title="عرض تفاصيل التتبع والملف المرجعي للحدث"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Live Simulator & Event Details Sidebar (Right Column) */}
        <div className="space-y-6">
          
          {/* A. Live Simulator: Interactive Log Triggerer */}
          <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(15,76,129,0.02)] p-5 rounded-2xl space-y-4">
            <div className="border-b border-white/40 pb-3">
              <div className="flex items-center gap-2 text-[#0F4C81]">
                <Play className="w-4 h-4 text-emerald-500 animate-pulse" />
                <h4 className="text-xs font-black text-slate-800">محاكي أحداث النظام الحي (ERP Simulator)</h4>
              </div>
              <p className="text-[9px] text-slate-400 font-bold mt-1 leading-relaxed">
                استخدم هذا المحاكي لإضافة حدث أمني أو مالي جديد لمراقبة كيفية تتبع النظام وسلوك الفلترة الحية الفورية.
              </p>
            </div>

            <form onSubmit={handleSimulateLog} className="space-y-3.5 text-xs text-right">
              
              <div>
                <label className="block font-bold text-slate-600 mb-1">الموظف القائم بالإجراء *</label>
                <select
                  required
                  value={simActor}
                  onChange={e => setSimActor(e.target.value)}
                  className="w-full p-2 border border-slate-200/60 bg-white/50 backdrop-blur-xs rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F4C81]"
                >
                  <option value="أشرف سليمان">أشرف سليمان (مدير النظام)</option>
                  <option value="محمد خليل">محمد خليل (المدير المالي التنفيذي)</option>
                  <option value="ياسر حسن">ياسر حسن (مهندس صيانة رئيسي)</option>
                  <option value="سامح سمير">سامح سمير (مسؤول بوابة)</option>
                  <option value="نوران عادل">نوران عادل (موارد بشرية)</option>
                  <option value="رأفت أبو سريع">رأفت أبو سريع (كابتن تشغيلي)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">نوع العملية</label>
                  <select
                    value={simActionType}
                    onChange={e => setSimActionType(e.target.value as any)}
                    className="w-full p-2 border border-slate-200/60 bg-white/50 backdrop-blur-xs rounded-lg text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F4C81]"
                  >
                    {actionTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label.split(' ')[0]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">الخطورة</label>
                  <select
                    value={simSeverity}
                    onChange={e => setSimSeverity(e.target.value as any)}
                    className="w-full p-2 border border-slate-200/60 bg-white/50 backdrop-blur-xs rounded-lg text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F4C81]"
                  >
                    <option value="info">اعتيادي (Info)</option>
                    <option value="warning">تحذيري (Warning)</option>
                    <option value="critical">حرج جداً (Critical)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">القسم / الموديول المستهدف</label>
                <select
                  value={simModule}
                  onChange={e => setSimModule(e.target.value)}
                  className="w-full p-2 border border-slate-200/60 bg-white/50 backdrop-blur-xs rounded-lg text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F4C81]"
                >
                  {modules.map(mod => (
                    <option key={mod} value={mod}>{mod}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">وصف الحدث الدقيق *</label>
                <textarea
                  required
                  value={simDescription}
                  onChange={e => setSimDescription(e.target.value)}
                  placeholder="مثال: صرف سلفة صيانة معتمدة لقطع الغيار، أو تعديل تتبع حي للونش..."
                  rows={2}
                  className="w-full p-2 border border-slate-200/60 bg-white/50 backdrop-blur-xs rounded-lg text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F4C81] resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-blue-700 to-[#0F4C81] text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01]"
              >
                <Play className="w-3.5 h-3.5 text-amber-400" />
                <span>حقن الحدث في السجل الفوري</span>
              </button>
            </form>
          </div>

          {/* B. Detailed Drawer Card (Appears as beautiful widget once a log is selected) */}
          {selectedLog ? (
            <div className="bg-white/40 backdrop-blur-md border border-[#0F4C81]/30 shadow-[0_8px_32px_0_rgba(15,76,129,0.04)] p-5 rounded-2xl space-y-4 animate-fadeIn relative">
              <button 
                onClick={() => setSelectedLog(null)}
                className="absolute top-4 left-4 p-1 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-colors"
                title="إغلاق معاينة الحدث"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="border-b border-slate-200/50 pb-3">
                <span className="text-[9px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                  تفاصيل السجل التقني الكامل
                </span>
                <h4 className="text-xs font-black text-slate-800 mt-2 font-mono">{selectedLog.id}</h4>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">زمن تسجيل الحدث: {selectedLog.timestamp}</p>
              </div>

              <div className="space-y-3.5 text-xs text-right">
                
                <div className="grid grid-cols-2 gap-3 bg-white/60 p-3 rounded-xl border border-slate-100/50">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">القائم بالحدث (Actor):</span>
                    <span className="text-slate-800 font-black block mt-0.5 text-[11px]">{selectedLog.userName}</span>
                    <span className="text-[9px] text-slate-500 block mt-0.25">{selectedLog.userRole}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">عنوان الشبكة (IP):</span>
                    <span className="text-[#0F4C81] font-mono font-bold block mt-0.5 text-[11px] flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedLog.ipAddress}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-white/60 p-3 rounded-xl border border-slate-100/50">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">نوع الحدث الهيكلي:</span>
                    <div className="mt-1">{getActionBadge(selectedLog.actionType)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">المستوى الأمني:</span>
                    <div className="mt-1">{getSeverityBadge(selectedLog.severity)}</div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">الموديول / النظام المستهدف:</span>
                  <span className="font-extrabold text-slate-700 block mt-0.5 text-[11px]">{selectedLog.module}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">بيان الحدث اللغوي:</span>
                  <p className="font-bold text-slate-700 bg-white/70 p-3 rounded-xl border border-slate-100 leading-relaxed text-[11px]">
                    {selectedLog.description}
                  </p>
                </div>

                {/* Payload Metadata Display */}
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold mb-1">البيانات التقنية المصاحبة (Payload Metadata):</span>
                  <pre className="text-[10px] bg-slate-900 text-slate-200 p-3 rounded-xl font-mono overflow-x-auto text-left ltr-code border border-slate-800 shadow-inner max-h-[160px]">
                    {selectedLog.details || `{\n  "status": "success",\n  "system_log_no": "${selectedLog.id}",\n  "actor": "${selectedLog.userName}",\n  "ip_address": "${selectedLog.ipAddress}",\n  "severity": "${selectedLog.severity}"\n}`}
                  </pre>
                </div>

                {selectedLog.severity === 'critical' && (
                  <div className="bg-rose-50 text-rose-700 p-3 rounded-xl border border-rose-100 text-[10px] font-black leading-relaxed">
                    تنبيه أمني: يتطلب هذا الحدث الحرج التحقق مع سجلات خادم ERP ومقارنة بصمة الموظف لمنع أي تسلل.
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="bg-slate-100/30 backdrop-blur-md border border-dashed border-slate-300 p-8 rounded-2xl text-center text-slate-400 font-extrabold text-xs">
              <Eye className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
              <span>انقر على أي صف في السجل لعرض تفاصيل التتبع التقني ومخرجات أجهزة الفحص وبصمة IP.</span>
            </div>
          )}

        </div>

      </div>
        </>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          
          {/* A. Backup Status KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white/50 backdrop-blur-md border border-white/70 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold block">حالة النسخ الاحتياطي التلقائي</span>
                <p className="text-xl font-black text-emerald-600">نشط وتلقائي يومي</p>
                <span className="text-[9px] text-slate-500 font-extrabold bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-full inline-block">
                  دورة الـ 24 ساعة الأمنية
                </span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white/50 backdrop-blur-md border border-white/70 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold block">أرشيف النسخ المخزن</span>
                <p className="text-xl font-black text-slate-800 font-mono">{autoBackups.length} نقاط استرجاع</p>
                <span className="text-[9px] text-slate-500 font-extrabold bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-full inline-block">
                  الحد الأقصى للتخزين: 10
                </span>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-sm">
                <Database className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white/50 backdrop-blur-md border border-white/70 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold block">تشفير التصدير اليدوي</span>
                <p className="text-xl font-black text-indigo-700">مؤمن بالكامل (.egc)</p>
                <span className="text-[9px] text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-full inline-block">
                  خوارزمية XOR + Salt مشفرة
                </span>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-sm">
                <Key className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white/50 backdrop-blur-md border border-white/70 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold block">مرونة التخزين والربط</span>
                <p className="text-xl font-black text-orange-600 font-mono">100% مستقل محلياً</p>
                <span className="text-[9px] text-orange-600 font-extrabold bg-orange-50 border border-orange-100/50 px-2 py-0.5 rounded-full inline-block">
                  ضمان أمن البيانات الحساسة
                </span>
              </div>
              <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl border border-orange-100 shadow-sm">
                <Globe className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* B. Action Panel Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Manual Export */}
            <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(15,76,129,0.02)] p-6 rounded-2xl space-y-4">
              <div className="border-b border-white/40 pb-3 flex items-center gap-2">
                <Download className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-800">تصدير وتشفير قاعدة البيانات اليدوي (Manual Secure Export)</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-bold">توليد ملف مشفر ومحمي بكلمة مرور مخصصة للتخزين الخارجي الآمن.</p>
                </div>
              </div>

              {exportSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-black rounded-xl animate-fadeIn">
                  {exportSuccess}
                </div>
              )}

              <form onSubmit={handleExportEncryptedFile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">أدخل كلمة مرور قوية لتأمين وتشفير الملف *</label>
                  <input
                    type="password"
                    required
                    placeholder="مثال: EgyptCranes@Secure2026"
                    value={exportPasscode}
                    onChange={(e) => setExportPasscode(e.target.value)}
                    className="w-full p-2.5 border border-slate-200/60 bg-white/50 backdrop-blur-xs rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F4C81]"
                  />
                  <p className="text-[9px] text-slate-400 mt-1.5 leading-relaxed font-bold">
                    ⚠️ تنبيه هام: بدون كلمة المرور هذه، لن يتمكن أي شخص -بما في ذلك مدير النظام- من فك تشفير هذا الملف أو استعادة البيانات في المستقبل! احفظها بعناية.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01]"
                  >
                    <Download className="w-4 h-4 text-indigo-200" />
                    <span>توليد وتصدير ملف قاعدة البيانات المشفر (.egc)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateManualBackup}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    title="حفظ كعرض استرجاع فوري محلي"
                  >
                    <Database className="w-4 h-4 text-orange-400" />
                    <span>نقطة استرجاع فورية</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Manual Import */}
            <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(15,76,129,0.02)] p-6 rounded-2xl space-y-4">
              <div className="border-b border-white/40 pb-3 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-orange-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-800">استيراد واستعادة النظام المشفر (Decrypt & Restore Database)</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-bold">رفع ملف قاعدة البيانات المتكامل (.egc) وفك تشفيره لإعادة حالة النظام للعمل.</p>
                </div>
              </div>

              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-black rounded-xl">
                  {importError}
                </div>
              )}

              {importSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-black rounded-xl animate-fadeIn">
                  {importSuccess}
                </div>
              )}

              <form onSubmit={handleImportEncryptedFile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">حدد ملف النسخة الاحتياطية (.egc) *</label>
                    <input
                      type="file"
                      required
                      accept=".egc,.json,.txt"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setImportFile(e.target.files[0]);
                          setImportError('');
                        }
                      }}
                      className="w-full p-2 border border-dashed border-slate-300 bg-white/40 rounded-xl text-xs font-bold text-slate-600 focus:outline-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">أدخل رمز فك التشفير (كلمة المرور) *</label>
                    <input
                      type="password"
                      required
                      placeholder="كلمة مرور الملف المرفق"
                      value={importPasscode}
                      onChange={(e) => setImportPasscode(e.target.value)}
                      className="w-full p-2.5 border border-slate-200/60 bg-white/50 backdrop-blur-xs rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F4C81]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] mt-2"
                >
                  <ShieldCheck className="w-4 h-4 text-orange-200" />
                  <span>فك التشفير وتعميد استعادة النظام الكلي فورياً</span>
                </button>
              </form>
            </div>

          </div>

          {/* C. Local Repository Table */}
          <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-sm p-6 rounded-2xl space-y-4">
            <div className="border-b border-white/40 pb-3">
              <h3 className="text-sm font-black text-slate-800">أرشيف ومستودع النسخ الاحتياطية المتاحة محلياً</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-bold">قائمة بنقاط الاستعادة التلقائية واليدوية المخزنة في خادم المتصفح الآمن لشركة مصر للأوناش.</p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-extrabold border-b border-slate-200">
                    <th className="px-4 py-3">معرف النسخة (Backup ID)</th>
                    <th className="px-4 py-3">التاريخ والوقت</th>
                    <th className="px-4 py-3">النوع (Type)</th>
                    <th className="px-4 py-3">الحجم التقريبي (Size)</th>
                    <th className="px-4 py-3 text-center">إجراءات استعادة الأمان</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {autoBackups.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-bold">
                        لا توجد نسخ احتياطية محفوظة حالياً. سيقوم النظام بإنشاء أول نسخة تلقائياً اليوم أو عند النقر على "نقطة استرجاع فورية" أعلاه.
                      </td>
                    </tr>
                  ) : (
                    autoBackups.map((backup) => (
                      <tr key={backup.id} className="hover:bg-white/50 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-[11px] font-black text-slate-700">{backup.id}</td>
                        <td className="px-4 py-3.5 font-mono text-[11px] font-bold text-slate-500">{backup.timestamp}</td>
                        <td className="px-4 py-3.5">
                          {backup.type === 'auto' ? (
                            <span className="px-2.5 py-0.5 text-[9px] font-black rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">تلقائي يومي</span>
                          ) : (
                            <span className="px-2.5 py-0.5 text-[9px] font-black rounded-md bg-blue-50 text-blue-700 border border-blue-200">يدوي فوري</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500 font-bold">{(backup.size / 1024).toFixed(2)} KB</td>
                        <td className="px-4 py-3.5 flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleRestoreAutoBackup(backup)}
                            className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-black text-[10px] rounded-lg transition-colors cursor-pointer"
                          >
                            استعادة سريعة
                          </button>
                          <button
                            onClick={() => handleDeleteAutoBackup(backup.id)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="حذف النسخة الاحتياطية"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
