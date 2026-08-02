import {
  User, Role, Crane, Vehicle, Driver, CostCenter, JournalEntry,
  AccountNode, Invoice, Contract, MaintenanceOrder, InventoryItem,
  Tender, Trip, GatePass, AttendanceLog, Employee, LeaveRequest, Payroll,
  FixedAsset, EmployeeLoan, EmployeeCustody, TaskAssignment,
  LubricationSchedule, LubricationTask, SparePartsRequest, AssetMaintenanceBudget
} from './types';

export const initialUsers: User[] = [
  { id: '1', username: 'admin', fullName: 'أشرف سليمان', email: 'asoliman@egyptcranes.com', phone: '01001234567', department: 'تقنية المعلومات', jobTitle: 'مدير الأنظمة والشبكات', isActive: true, roleId: '1', roleName: 'مدير النظام', createdAt: '2025-01-01' },
  { id: '2', username: 'm.khalil', fullName: 'محمد خليل', email: 'm.khalil@egyptcranes.com', phone: '01229876543', department: 'المالية', jobTitle: 'المدير المالي التنفيذي', isActive: true, roleId: '2', roleName: 'محاسب أول', createdAt: '2025-02-15' },
  { id: '3', username: 'y.hassan', fullName: 'ياسر حسن', email: 'y.hassan@egyptcranes.com', phone: '01115554433', department: 'العمليات والصيانة', jobTitle: 'مهندس صيانة أوناش رئيسي', isActive: true, roleId: '3', roleName: 'مهندس صيانة', createdAt: '2025-03-10' },
  { id: '4', username: 's.samir', fullName: 'سامح سمير', email: 's.samir@egyptcranes.com', phone: '01552221100', department: 'الحركة واللوجستيات', jobTitle: 'مسؤول البوابة والحركة', isActive: true, roleId: '4', roleName: 'مسؤول بوابة', createdAt: '2025-04-20' },
  { id: '5', username: 'n.adel', fullName: 'نوران عادل', email: 'n.adel@egyptcranes.com', phone: '01009998877', department: 'الموارد البشرية', jobTitle: 'أخصائي شؤون العاملين', isActive: true, roleId: '5', roleName: 'موارد بشرية', createdAt: '2025-05-01' },
];

export const initialRoles: Role[] = [
  { id: '1', name: 'System Admin', nameAr: 'مدير النظام', description: 'صلاحيات كاملة وغير محدودة على كافة موديولات النظام', isSystem: true, isActive: true, userCount: 1 },
  { id: '2', name: 'Finance Admin', nameAr: 'الإدارة المالية', description: 'إدارة شجرة الحسابات، قيود اليومية، الفواتير، ومراكز التكلفة والتقارير المالية', isSystem: false, isActive: true, userCount: 1 },
  { id: '3', name: 'Maintenance Manager', nameAr: 'إدارة الصيانة والتشغيل', description: 'إدارة الصيانة الوقائية والطارئة للأوناش وقطع الغيار وتقارير الأعطال', isSystem: false, isActive: true, userCount: 1 },
  { id: '4', name: 'Gate Officer', nameAr: 'أمن ومسؤول البوابة', description: 'تسجيل دخول وخروج الأوناش والسيارات وفحص المكونات ورموز QR', isSystem: false, isActive: true, userCount: 1 },
  { id: '5', name: 'HR specialist', nameAr: 'الموارد البشرية', description: 'إدارة الحضور والانصراف، الرواتب، الإجازات، وشؤون الموظفين والملفات', isSystem: false, isActive: true, userCount: 1 },
];

export const initialCranes: Crane[] = [
  { id: 'c1', code: 'EC-CR-250', nameAr: 'ونش تلسكوبي ديمباج Demag AC 250-5', model: 'Demag AC 250-5', capacity: 250, status: 'running', operatorName: 'كابتن محمود الجارحي', plateNumber: 'ج ب ر ٨٧٥٢', lat: 30.0130, lng: 31.7050, speed: 25, fuelLevel: 78 }, // New Capital
  { id: 'c2', code: 'EC-CR-100', nameAr: 'ونش تلسكوبي ليبهير Liebherr LTM 1100', model: 'Liebherr LTM 1100-4.2', capacity: 100, status: 'running', operatorName: 'كابتن صابر عبد المولى', plateNumber: 'أ ن ص ٩٣١٤', lat: 31.2001, lng: 29.9182, speed: 45, fuelLevel: 92 }, // Alexandria Port
  { id: 'c3', code: 'EC-CR-400', nameAr: 'ونش جنزير تيريكس Terex CC 2400-1', model: 'Terex CC 2400-1', capacity: 400, status: 'idle', operatorName: 'كابتن عبد الرحمن البحيري', plateNumber: 'ب ق ص ١٢٤٨', lat: 29.9538, lng: 32.5253, speed: 0, fuelLevel: 55 }, // Suez Canal
  { id: 'c4', code: 'EC-CR-600', nameAr: 'ونش جنزير ليبهير Liebherr LR 1600/2', model: 'Liebherr LR 1600/2', capacity: 600, status: 'maintenance', operatorName: 'كابتن توفيق النبوي', plateNumber: 'م ن ج ٧٥١٢', lat: 29.9801, lng: 31.1342, speed: 0, fuelLevel: 12 }, // Giza Yard
  { id: 'c5', code: 'EC-CR-120', nameAr: 'ونش جروف تلسكوبي Grove GMK 5130-2', model: 'Grove GMK 5130-2', capacity: 130, status: 'running', operatorName: 'كابتن شوقي علام', plateNumber: 'س ع ط ٤٢١٩', lat: 27.2579, lng: 33.8116, speed: 60, fuelLevel: 64 }, // Hurghada
];

export const initialVehicles: Vehicle[] = [
  { id: 'v1', code: 'EC-VH-01', type: 'رأس جرار مرسيدس اكتروس Mercedes Actros', plateNumber: 'ي ج د ٨٥٦٤', driverName: 'شريف عبد الحفيظ', status: 'on_trip' },
  { id: 'v2', code: 'EC-VH-02', type: 'رأس جرار مان MAN TGX', plateNumber: 'ق ص أ ٧٤١٩', driverName: 'رأفت أبو سريع', status: 'active' },
  { id: 'v3', code: 'EC-VH-03', type: 'مقطورة مسطحة جامبو LPT', plateNumber: 'ن ر ط ٦٢٣١', driverName: 'فتحي القباج', status: 'active' },
  { id: 'v4', code: 'EC-VH-04', type: 'سيارة دعم صيانة تويوتا هايلوكس', plateNumber: 'ص م و ٣٥٤١', driverName: 'ممدوح الصاوي', status: 'maintenance' },
];

export const initialDrivers: Driver[] = [
  { id: 'd1', name: 'شريف عبد الحفيظ', phone: '01014125132', licenseNumber: 'درجة أولى - ٩٨٥٦٤٢', status: 'on_trip' },
  { id: 'd2', name: 'رأفت أبو سريع', phone: '01224521453', licenseNumber: 'درجة أولى - ٧٥١٢٤٨', status: 'active' },
  { id: 'd3', name: 'فتحي القباج', phone: '01114521458', licenseNumber: 'درجة ثانية - ٦٥١٢٤٩', status: 'active' },
  { id: 'd4', name: 'ممدوح الصاوي', phone: '01556214523', licenseNumber: 'درجة أولى - ٣٢١٤٥٧', status: 'active' },
  { id: 'd5', name: 'عصام الغندور', phone: '01003214587', licenseNumber: 'درجة أولى - ١٥٤٢٦٩', status: 'vacation' },
];

export const initialCostCenters: CostCenter[] = [
  { id: 'cc1', code: 'CC-NC-01', nameAr: 'مشروع العاصمة الإدارية الجديدة - الأيقوني', nameEn: 'New Administrative Capital Iconic Tower Project', department: 'موقع العمليات الخارجي', budget: 15000000, usedBudget: 9850000, isActive: true, managerName: 'م. إبراهيم فوزي' },
  { id: 'cc2', code: 'CC-ALX-02', nameAr: 'مشروع تطوير ميناء الإسكندرية الأرصفة الجديدة', nameEn: 'Alexandria Port New Quays Development Project', department: 'موقع العمليات الخارجي', budget: 8000000, usedBudget: 6120000, isActive: true, managerName: 'م. سامح الشاذلي' },
  { id: 'cc3', code: 'CC-YARD-GZ', nameAr: 'ورشة ومخازن الشركة الرئيسية بالجيزة', nameEn: 'Giza Central Workshop and Warehouses', department: 'الورشة والصيانة والتشغيل المركزية', budget: 4000000, usedBudget: 3450000, isActive: true, managerName: 'مهندس ياسر حسن' },
  { id: 'cc4', code: 'CC-ADMIN', nameAr: 'المركز الإداري الرئيسي - الدقي', nameEn: 'Dokki Central Administrative HQ', department: 'الإدارة العامة والمبيعات والمالية', budget: 2500000, usedBudget: 1850000, isActive: true, managerName: 'أستاذ محمد خليل' },
  { id: 'cc5', code: 'CC-SC-03', nameAr: 'مشروع توسعة أنفاق قناة السويس وبورسعيد', nameEn: 'Suez Canal & Port Said Tunnels Expansion Project', department: 'موقع العمليات الخارجي', budget: 12000000, usedBudget: 11950000, isActive: true, managerName: 'م. خالد جلال' },
];

export const initialJournalEntries: JournalEntry[] = [
  { 
    id: 'j1', 
    docNo: 'JV-2026-001', 
    date: '2026-07-01', 
    description: 'إثبات فاتورة إيرادات تشغيل ونش ديمباج ٢٥٠ طن بموقع العاصمة الإدارية - شركة المقاولون العرب', 
    debit: 450000, 
    credit: 450000, 
    status: 'approved',
    lines: [
      { accountName: 'حسابات العملاء (تأجير معدات)', debit: 450000, credit: 0 },
      { accountName: 'إيرادات وعقود تأجير أسطول الأوناش الثقيلة', debit: 0, credit: 450000 }
    ]
  },
  { 
    id: 'j2', 
    docNo: 'JV-2026-002', 
    date: '2026-07-02', 
    description: 'صرف تكاليف صيانة طارئة وشراء قطع غيار هيدروليكية لونش CC 2400', 
    debit: 125000, 
    credit: 125000, 
    status: 'approved',
    lines: [
      { accountName: 'مصاريف صيانة الأوناش والزيوت', debit: 125000, credit: 0 },
      { accountName: 'نقدية بالبنوك', debit: 0, credit: 125000 }
    ]
  },
  { 
    id: 'j3', 
    docNo: 'JV-2026-003', 
    date: '2026-07-05', 
    description: 'شراء وتوريد سولار تشغيل أوناش ومركبات الحركة لورشة الجيزة والمواقع', 
    debit: 85000, 
    credit: 85000, 
    status: 'pending',
    lines: [
      { accountName: 'مصاريف صيانة الأوناش والزيوت', debit: 85000, credit: 0 },
      { accountName: 'نقدية بالبنوك', debit: 0, credit: 85000 }
    ]
  },
  { 
    id: 'j4', 
    docNo: 'JV-2026-004', 
    date: '2026-07-08', 
    description: 'إثبات دفعة مقدمة من عقد تأجير ونش LR 1600 لموقع بورسعيد - أوراسكوم للإنشاءات', 
    debit: 1200000, 
    credit: 1200000, 
    status: 'approved',
    lines: [
      { accountName: 'نقدية بالبنوك', debit: 1200000, credit: 0 },
      { accountName: 'حسابات العملاء (تأجير معدات)', debit: 0, credit: 1200000 }
    ]
  },
];

export const initialAccounts: AccountNode = {
  id: '1',
  code: '1',
  nameAr: 'الأصول (Assets)',
  balance: 45000000,
  type: 'assets',
  children: [
    {
      id: '11',
      code: '11',
      nameAr: 'الأصول الثابتة (Fixed Assets)',
      balance: 32000000,
      type: 'assets',
      children: [
        { id: '111', code: '111', nameAr: 'أوناش ومعدات الرفع الثقيل', balance: 25000000, type: 'assets' },
        { id: '112', code: '112', nameAr: 'سيارات نقل ثقيل وجرارات ومقطورات', balance: 5000000, type: 'assets' },
        { id: '113', code: '113', nameAr: 'أجهزة كمبيوتر ومعدات شبكات المكاتب', balance: 2000000, type: 'assets' }
      ]
    },
    {
      id: '12',
      code: '12',
      nameAr: 'الأصول المتداولة (Current Assets)',
      balance: 13000000,
      type: 'assets',
      children: [
        { id: '121', code: '121', nameAr: 'نقدية بالبنوك (البنك الأهلي وبنك مصر)', balance: 8500000, type: 'assets' },
        { id: '122', code: '122', nameAr: 'حسابات العملاء (شؤون تأجير المعدات)', balance: 3500000, type: 'assets' },
        { id: '123', code: '123', nameAr: 'مخازن قطع الغيار والمستهلكات والزيوت', balance: 1000000, type: 'assets' }
      ]
    }
  ]
};

export const initialInvoices: Invoice[] = [
  {
    id: 'inv1',
    invoiceNo: 'INV-2026-101',
    date: '2026-07-01',
    customerName: 'المقاولون العرب (عثمان أحمد عثمان)',
    amount: 391304.35,
    tax: 58695.65,
    total: 450000,
    status: 'paid',
    items: [
      { id: 'item1', description: 'إيجار ونش تلسكوبي ديمباج ٢٥٠ طن - موقع العاصمة الإدارية (شامل السائق والوقود) - فترة أسبوع', qty: 1, unitPrice: 391304.35, total: 391304.35 }
    ]
  },
  {
    id: 'inv2',
    invoiceNo: 'INV-2026-102',
    date: '2026-07-04',
    customerName: 'أوراسكوم للإنشاءات وصناعات حديد السويس',
    amount: 1043478.26,
    tax: 156521.74,
    total: 1200000,
    status: 'partially_paid',
    items: [
      { id: 'item2', description: 'خدمات رفع ثقيل بواسطة ونش جنزير ليبهير LR 1600 - مشروع تطوير بورسعيد - دفعة أولى بموجب العقد', qty: 1, unitPrice: 1043478.26, total: 1043478.26 }
    ]
  },
  {
    id: 'inv3',
    invoiceNo: 'INV-2026-103',
    date: '2026-07-08',
    customerName: 'السويدي إلكتريك - مشروعات طاقة الرياح بخليج السويس',
    amount: 650000,
    tax: 97500,
    total: 747500,
    status: 'unpaid',
    items: [
      { id: 'item3', description: 'شحن ونقل وتثبيت أجزاء توربينات هواء عملاقة بواسطة الأوناش التخصصية', qty: 1, unitPrice: 650000, total: 650000 }
    ]
  }
];

export const initialContracts: Contract[] = [
  { id: 'cnt1', contractNo: 'EC-CNT-2026-01', customerName: 'المقاولون العرب - مشروع مركز مصر الثقافي الإسلامي', craneId: 'c1', craneName: 'Demag AC 250-5', startDate: '2026-06-01', endDate: '2026-08-31', value: 1800000, status: 'active' },
  { id: 'cnt2', contractNo: 'EC-CNT-2026-02', customerName: 'هيئة ميناء الإسكندرية - أرصفة الحاويات الجديدة', craneId: 'c2', craneName: 'Liebherr LTM 1100-4.2', startDate: '2026-05-15', endDate: '2026-11-15', value: 3600000, status: 'active' },
  { id: 'cnt3', contractNo: 'EC-CNT-2026-03', customerName: 'بتروجيت للخدمات البترولية والمستودعات', craneId: 'c3', craneName: 'Terex CC 2400-1', startDate: '2026-02-01', endDate: '2026-05-31', value: 2400000, status: 'completed' },
];

export const initialMaintenanceOrders: MaintenanceOrder[] = [
  { id: 'mo1', orderNo: 'WO-2026-001', craneId: 'c4', craneName: 'Liebherr LR 1600/2', type: 'corrective', cost: 180000, description: 'عمرة هيدروليكية كاملة للمحركات والوصلات التلسكوبية بسبب تسريب زيت بمسارات الضغط العالي', date: '2026-07-02', status: 'in_progress' },
  { id: 'mo2', orderNo: 'WO-2026-002', craneId: 'c1', craneName: 'Demag AC 250-5', type: 'preventive', cost: 12000, description: 'صيانة دورية مجدولة وفحص حبال الرفع الفولاذية والتشحيم واستبدال فلاتر السولار والزيت', date: '2026-07-06', status: 'completed' },
  { id: 'mo3', orderNo: 'WO-2026-003', craneId: 'c3', craneName: 'Terex CC 2400-1', type: 'preventive', cost: 35000, description: 'معايرة أجهزة السلامة والأوزان وحساسات الحمل والرياح الإلكترونية بالكبينة لترخيص الونش سنويًا', date: '2026-07-10', status: 'pending' },
];

export const initialInventoryItems: InventoryItem[] = [
  { id: 'itm1', code: 'EC-INV-HYD-50', nameAr: 'خراطيم ضغط عالي هيدروليك إيطالي ٥٠ بار', category: 'قطع غيار هيدروليكية', unit: 'متر', currentQty: 180, minQty: 50, unitPrice: 450, warehouseName: 'المخزن الرئيسي - الجيزة ورشة' },
  { id: 'itm2', code: 'EC-INV-FLT-D8', nameAr: 'فلتر ديزل زيت أصلي أوناش ديمباج و ليبهير', category: 'فلاتر ومستهلكات', unit: 'قطعة', currentQty: 14, minQty: 25, unitPrice: 1850, warehouseName: 'المخزن الرئيسي - الجيزة ورشة' },
  { id: 'itm3', code: 'EC-INV-SLR-CL', nameAr: 'براميل شحم تالكو ثقيل هيدروليكس مقاوم للملوحة', category: 'زيوت ومواد كيميائية', unit: 'برميل', currentQty: 40, minQty: 15, unitPrice: 3200, warehouseName: 'مخزن الزيوت والمستهلكات السريعة' },
  { id: 'itm4', code: 'EC-INV-WRE-18', nameAr: 'حبل واير فولاذي مضاد للالتواء سمك ١٨ مم حمولة عالية', category: 'حبال وأسلاك الرفع', unit: 'متر', currentQty: 600, minQty: 200, unitPrice: 280, warehouseName: 'المخزن الرئيسي - الجيزة ورشة' },
  { id: 'itm5', code: 'EC-INV-SNSR-AN', nameAr: 'حساس قياس زاوية البوم والميل الأوتوماتيكي', category: 'حساسات وأجهزة إلكترونية', unit: 'وحدة', currentQty: 2, minQty: 5, unitPrice: 16500, warehouseName: 'مخزن المستلزمات والقطع الدقيقة' },
];

export const initialTenders: Tender[] = [
  { id: 't1', code: 'EC-TND-2026-11', title: 'مناقصة عامة لتأجير أوناش تخصصية لرفع أبراج الاتصالات بمحافظات الصعيد - وزارة الاتصالات والتحول الرقمي', closingDate: '2026-07-25', bidAmount: 4800000, status: 'submitted' },
  { id: 't2', code: 'EC-TND-2026-12', title: 'مناقصة محدودة لتقديم أوناش تلسكوبية لمشروع تصنيع السفن الجديد بهيئة قناة السويس ببورسعيد', closingDate: '2026-08-01', bidAmount: 8500000, status: 'pending' },
  { id: 't3', code: 'EC-TND-2026-09', title: 'مناقصة الهيئة الهندسية للقوات المسلحة لتشييد الكباري والتقاطعات بمحور فوه الجديد بكفر الشيخ', closingDate: '2026-06-15', bidAmount: 6200000, status: 'won' },
];

export const initialTrips: Trip[] = [
  { id: 'tr1', tripNo: 'TR-2026-045', craneId: 'c1', craneName: 'Demag AC 250-5', driverId: 'd1', driverName: 'شريف عبد الحفيظ', vehicleId: 'v1', vehicleCode: 'EC-VH-01 (Actros)', departureGate: 'بوابة الورشة الرئيسية بالجيزة', destination: 'موقع فندق الأيقونة بالعاصمة الإدارية', departureTime: '2026-07-09 05:30', status: 'active' },
  { id: 'tr2', tripNo: 'TR-2026-042', craneId: 'c2', craneName: 'Liebherr LTM 1100-4.2', driverId: 'd2', driverName: 'رأفت أبو سريع', vehicleId: 'v2', vehicleCode: 'EC-VH-02 (MAN)', departureGate: 'ورشة بفرع الإسكندرية', destination: 'رصيف الحاويات ٥٥ بميناء الدخيلة الإسكندرية', departureTime: '2026-07-08 08:00', arrivalTime: '2026-07-08 10:15', status: 'completed' },
];

export const initialGatePasses: GatePass[] = [
  {
    id: 'gp1',
    passNo: 'GP-OUT-9081',
    type: 'out',
    craneId: 'c1',
    craneName: 'Demag AC 250-5',
    driverName: 'شريف عبد الحفيظ',
    timestamp: '2026-07-09 05:30',
    hasScanFail: false,
    missingItems: [],
    checklist: {
      'رخصة ونش سارية واللوحات واضحة': true,
      'فحص سلامة الفرامل والأضواء': true,
      'شهادة فحص وايرات وسلاسل معتمدة': true,
      'مستند تصريح الخروج وأمر الشغل': true,
      'ارتداء السائق لمهمات الوقاية الشخصية': true,
      'فحص حساس الميل والسرعة': true
    }
  },
  {
    id: 'gp2',
    passNo: 'GP-IN-8542',
    type: 'in',
    craneId: 'c4',
    craneName: 'Liebherr LR 1600/2',
    driverName: 'ممدوح الصاوي',
    timestamp: '2026-07-08 17:45',
    hasScanFail: true,
    missingItems: ['طفاية حريق بودرة ٦ كيلو من الكبينة', 'عدة صيانة الهيدروليك والشنطة رقم ٣'],
    checklist: {
      'مطابقة رقم اللوحة ورخصة الونش والمقطورة': true,
      'سلامة جسم الونش الخارجي وعدم وجود أضرار جديدة': true,
      'وجود طفاية حريق صالحة ومطابقة للوائح': false,
      'وجود كافة عدة الطوارئ والسلامة': false,
      'تقرير السائق عن تسليم المعدة': true
    }
  }
];

export const initialAttendance: AttendanceLog[] = [
  { id: 'a1', empName: 'أشرف سليمان', date: '2026-07-09', checkIn: '08:30', status: 'present' },
  { id: 'a2', empName: 'محمد خليل', date: '2026-07-09', checkIn: '08:15', status: 'present' },
  { id: 'a3', empName: 'ياسر حسن', date: '2026-07-09', checkIn: '08:55', status: 'late' },
  { id: 'a4', empName: 'سامح سمير', date: '2026-07-09', checkIn: '07:45', status: 'present' },
  { id: 'a5', empName: 'نوران عادل', date: '2026-07-09', checkIn: '08:05', status: 'present' },
  { id: 'a6', empName: 'أحمد صالح (مدير موقع)', date: '2026-07-09', checkIn: '08:00', status: 'present' },
  { id: 'a7', empName: 'فاطمة علي (مهندسة عقود)', date: '2026-07-09', checkIn: '00:00', status: 'leave' },
  { id: 'a8', empName: 'شريف عبد الحفيظ (سائق)', date: '2026-07-09', checkIn: '05:30', status: 'present' },
];

export const initialEmployees: Employee[] = [
  { id: 'emp1', name: 'أشرف سليمان', role: 'مدير الأنظمة والشبكات', department: 'تقنية المعلومات', phone: '01001234567', email: 'asoliman@egyptcranes.com', salary: 15000, hireDate: '2025-01-01', status: 'active', nationalId: '29001011234567' },
  { id: 'emp2', name: 'محمد خليل', role: 'المدير المالي التنفيذي', department: 'المالية', phone: '01229876543', email: 'm.khalil@egyptcranes.com', salary: 22000, hireDate: '2025-02-15', status: 'active', nationalId: '28503151234567' },
  { id: 'emp3', name: 'ياسر حسن', role: 'مهندس صيانة أوناش رئيسي', department: 'العمليات والصيانة', phone: '01115554433', email: 'y.hassan@egyptcranes.com', salary: 18000, hireDate: '2025-03-10', status: 'active', nationalId: '28805201234567' },
  { id: 'emp4', name: 'سامح سمير', role: 'مسؤول البوابة والحركة', department: 'الحركة واللوجستيات', phone: '01552221100', email: 's.samir@egyptcranes.com', salary: 9000, hireDate: '2025-04-20', status: 'active', nationalId: '29206251234567' },
  { id: 'emp5', name: 'نوران عادل', role: 'أخصائي شؤون العاملين', department: 'الموارد البشرية', phone: '01009998877', email: 'n.adel@egyptcranes.com', salary: 9500, hireDate: '2025-05-01', status: 'active', nationalId: '29509121234567' },
  { id: 'emp6', name: 'شريف عبد الحفيظ', role: 'سائق ونش ثقيل', department: 'الحركة واللوجستيات', phone: '01014125132', email: 's.abdelhafeez@egyptcranes.com', salary: 8000, hireDate: '2025-06-10', status: 'active', nationalId: '28912041234567' },
  { id: 'emp7', name: 'رأفت أبو سريع', role: 'سائق ونش ثقيل', department: 'الحركة واللوجستيات', phone: '01224521453', email: 'r.abusree@egyptcranes.com', salary: 8000, hireDate: '2025-06-15', status: 'active', nationalId: '29004111234567' },
  { id: 'emp8', name: 'فاطمة علي', role: 'مهندسة عقود ومشتريات', department: 'العقود والمناقصات', phone: '01147514214', email: 'f.ali@egyptcranes.com', salary: 11000, hireDate: '2025-07-01', status: 'vacation', nationalId: '29402121234567' },
];

export const initialLeaveRequests: LeaveRequest[] = [
  { id: 'lr1', empName: 'فاطمة علي', type: 'annual', startDate: '2026-07-05', endDate: '2026-07-12', days: 7, reason: 'إجازة سنوية لظروف عائلية والسفر', status: 'approved' },
  { id: 'lr2', empName: 'شريف عبد الحفيظ', type: 'emergency', startDate: '2026-07-15', endDate: '2026-07-16', days: 1, reason: 'ظرف صحي طارئ وعيادة طبيب الاسنان', status: 'pending' },
  { id: 'lr3', empName: 'ياسر حسن', type: 'sick', startDate: '2026-06-20', endDate: '2026-06-22', days: 2, reason: 'نزلة برد شديدة وراحة طبية معتمدة', status: 'approved' },
];

export const initialPayrolls: Payroll[] = [
  { id: 'pr1', empName: 'أشرف سليمان', month: '2026-06', basicSalary: 15000, allowances: 1500, deductions: 200, netSalary: 16300, status: 'paid' },
  { id: 'pr2', empName: 'محمد خليل', month: '2026-06', basicSalary: 22000, allowances: 2500, deductions: 0, netSalary: 24500, status: 'paid' },
  { id: 'pr3', empName: 'ياسر حسن', month: '2026-06', basicSalary: 18000, allowances: 2000, deductions: 500, netSalary: 19500, status: 'paid' },
  { id: 'pr4', empName: 'نوران عادل', month: '2026-06', basicSalary: 9500, allowances: 800, deductions: 150, netSalary: 10150, status: 'paid' },
  { id: 'pr5', empName: 'سامح سمير', month: '2026-06', basicSalary: 9000, allowances: 1000, deductions: 300, netSalary: 9700, status: 'draft' },
];

export const initialScreens = [
  { id: 'users', name: 'Users', nameAr: 'المستخدمين والمسؤولين', module: 'إدارة النظام والأمان' },
  { id: 'roles', name: 'Roles', nameAr: 'الأدوار وتراخيص الوصول', module: 'إدارة النظام والأمان' },
  { id: 'accounts', name: 'Accounts', nameAr: 'شجرة الحسابات', module: 'الإدارة المالية والمحاسبية' },
  { id: 'invoices', name: 'Invoices', nameAr: 'الفواتير الإلكترونية', module: 'المبيعات والعقود' },
  { id: 'contracts', name: 'Contracts', nameAr: 'العقود والارتباطات', module: 'المبيعات والعقود' },
  { id: 'tenders', name: 'Tenders', nameAr: 'العطاءات والمناقصات', module: 'المبيعات والعقود' },
  { id: 'journal', name: 'Journal Entries', nameAr: 'القيود اليومية', module: 'الإدارة المالية والمحاسبية' },
  { id: 'gate', name: 'Gate Passes', nameAr: 'تصاريح البوابات', module: 'الحركة والتشغيل الجغرافي' },
  { id: 'fleet', name: 'Fleet management', nameAr: 'أسطول الأوناش والناقلات', module: 'الحركة والتشغيل الجغرافي' },
  { id: 'maintenance', name: 'Maintenance', nameAr: 'أوامر صيانة المعدات', module: 'الورشة والصيانة' },
  { id: 'inventory', name: 'Inventory Items', nameAr: 'حركات المخازن وقطع الغيار', module: 'المخازن والتوريد' },
  { id: 'hr', name: 'HR and Staffing', nameAr: 'الموارد البشرية وشؤون العاملين', module: 'إدارة الكوادر والموظفين' },
];

export const initialApprovalRequests = [
  { id: 'req1', type: 'save' as const, screenName: 'الفواتير الإلكترونية', recordId: 'INV-2026-101', recordSummary: 'فاتورة مبيعات - المقاولون العرب - إيجار ونش ٢٥٠ طن بقيمة 450,000 ج.م', requestedByName: 'محمد خليل', requestDate: '2026-07-08T10:30:00', status: 'pending' as const },
  { id: 'req2', type: 'edit' as const, screenName: 'حركات المخازن وقطع الغيار', recordId: 'ITM-001', recordSummary: 'تعديل السعر القياسي لصنف لابتوب Dell XPS من 4500 ج.م إلى 4200 ج.م', requestedByName: 'أشرف سليمان', requestDate: '2026-07-08T09:15:00', status: 'pending' as const },
  { id: 'req3', type: 'delete' as const, screenName: 'العقود والارتباطات', recordId: 'CON-2026-005', recordSummary: 'حذف عقد تأجير ونش جنزير لموقع بورسعيد لشركة أوراسكوم لوجود خطأ فني', requestedByName: 'ياسر حسن', requestDate: '2026-07-07T16:45:00', status: 'approved' as const, approverName: 'أشرف سليمان', actionDate: '2026-07-07T17:00:00', notes: 'تمت مراجعته مع المبيعات وتبين تكرار العقد وتمت الموافقة على الحذف' },
  { id: 'req4', type: 'save' as const, screenName: 'العطاءات والمناقصات', recordId: 'TEN-2026-012', recordSummary: 'عطاء دراسة لتوسعة قناة السويس الجديد - قيمة الضمان الابتدائي 120,000 ج.م', requestedByName: 'محمد خليل', requestDate: '2026-07-07T14:20:00', status: 'rejected' as const, approverName: 'أشرف سليمان', actionDate: '2026-07-07T15:00:00', notes: 'يرجى مراجعة تقديرات التكاليف قبل الحفظ المعتمد للضمان' },
];

export const initialApprovalAuthorities = [
  { id: '1', userName: 'محمد خليل', screenName: 'الفواتير الإلكترونية', canApproveSave: true, canApproveDelete: false, canApproveEdit: true, approvalLimit: 500000, isActive: true },
  { id: '2', userName: 'أشرف سليمان', screenName: 'القيود اليومية', canApproveSave: true, canApproveDelete: true, canApproveEdit: true, approvalLimit: 2000000, isActive: true },
  { id: '3', userName: 'ياسر حسن', screenName: 'أوامر صيانة المعدات', canApproveSave: true, canApproveDelete: false, canApproveEdit: true, approvalLimit: 100000, isActive: true },
  { id: '4', userName: 'نوران عادل', screenName: 'الموارد البشرية وشؤون العاملين', canApproveSave: true, canApproveDelete: false, canApproveEdit: true, approvalLimit: 50000, isActive: true },
];

export const initialFixedAssets: FixedAsset[] = [
  {
    id: 'as1',
    code: 'EC-FA-001',
    nameAr: 'مكبس هيدروليكي كوماتسو ٥٠ طن لورشة التصنيع',
    category: 'workshop_machinery',
    purchaseDate: '2023-01-15',
    purchaseCost: 350000,
    salvageValue: 30000,
    usefulLife: 10,
    depreciationMethod: 'straight_line',
    location: 'ورشة ومخازن الشركة الرئيسية بالجيزة',
    currentValue: 238000,
    accumulatedDepreciation: 112000,
    maintenanceLog: [
      { id: 'ml1', date: '2025-12-10', type: 'صيانة دورية', description: 'تغيير زيت الهيدروليك وفلاتر ضغط المكبس بالكامل', cost: 4500, performer: 'فريق صيانة الورشة الداخلي', status: 'completed' },
      { id: 'ml2', date: '2026-06-05', type: 'فحص ومعايرة', description: 'معايرة مؤشر الضغط الأساسي والتأكد من صمام الأمان', cost: 1200, performer: 'الهيئة المصرية العامة للمواصفات والجودة', status: 'completed' }
    ]
  },
  {
    id: 'as2',
    code: 'EC-FA-002',
    nameAr: 'مولد كهربائي ديزل كاتربيلر 250 كافا احتياطي',
    category: 'workshop_machinery',
    purchaseDate: '2024-03-20',
    purchaseCost: 480000,
    salvageValue: 50000,
    usefulLife: 8,
    depreciationMethod: 'straight_line',
    location: 'ورشة ومخازن الشركة الرئيسية بالجيزة',
    currentValue: 355625,
    accumulatedDepreciation: 124375,
    maintenanceLog: [
      { id: 'ml3', date: '2026-01-15', type: 'صيانة دورية', description: 'تغيير فلاتر السولار والزيت وسير المروحة وتدقيق مستوى سائل التبريد', cost: 6200, performer: 'الشركة الهندسية للتوريدات والتوكيلات CAT', status: 'completed' },
      { id: 'ml4', date: '2026-07-10', type: 'إصلاح طارئ', description: 'صيانة الدينامو وحل مشكلة عدم شحن البطارية الأساسية', cost: 1800, performer: 'ورشة كهرباء السيارات التخصصية', status: 'completed' }
    ]
  },
  {
    id: 'as3',
    code: 'EC-FA-003',
    nameAr: 'سيارة إدارية شيفروليه أوبترا - مبيعات وعقود',
    category: 'admin_vehicles',
    purchaseDate: '2022-06-01',
    purchaseCost: 280000,
    salvageValue: 40000,
    usefulLife: 5,
    depreciationMethod: 'declining_balance',
    decliningRate: 25,
    location: 'المركز الإداري الرئيسي - الدقي',
    currentValue: 118125,
    accumulatedDepreciation: 161875,
    maintenanceLog: [
      { id: 'ml5', date: '2025-11-20', type: 'صيانة دورية', description: 'تغيير طقم إطارات أمامية تيل فرامل وسيور الصيانة العامة للـ ٦٠ ألف كم', cost: 8500, performer: 'مركز صيانة منصور شيفروليه المعتمد', status: 'completed' },
      { id: 'ml6', date: '2026-05-18', type: 'صيانة دورية', description: 'تغيير زيت المحرك والفلتر وفحص العفشة والتكييف', cost: 2400, performer: 'مركز صيانة سريع بالدقي', status: 'completed' }
    ]
  },
  {
    id: 'as4',
    code: 'EC-FA-004',
    nameAr: 'سيرفر داخلي مركزي Dell PowerEdge R750 لقواعد البيانات',
    category: 'it_networks',
    purchaseDate: '2025-01-10',
    purchaseCost: 210000,
    salvageValue: 10000,
    usefulLife: 5,
    depreciationMethod: 'straight_line',
    location: 'المركز الإداري الرئيسي - الدقي',
    currentValue: 150000,
    accumulatedDepreciation: 60000,
    maintenanceLog: [
      { id: 'ml7', date: '2025-07-05', type: 'فحص ومعايرة', description: 'تحديث البرمجيات الثابتة للـ BIOS، ومراجعة أنظمة التبريد الداخلي ومصفوفة RAID', cost: 3000, performer: 'فريق تقنية المعلومات الداخلي', status: 'completed' }
    ]
  },
  {
    id: 'as5',
    code: 'EC-FA-005',
    nameAr: 'كونتينر مكاتب إدارية جاهز ومكيف (موقع بورسعيد)',
    category: 'office_furniture',
    purchaseDate: '2025-08-01',
    purchaseCost: 150000,
    salvageValue: 15000,
    usefulLife: 6,
    depreciationMethod: 'straight_line',
    location: 'مشروع توسعة أنفاق قناة السويس وبورسعيد',
    currentValue: 129375,
    accumulatedDepreciation: 20625,
    maintenanceLog: [
      { id: 'ml8', date: '2026-02-14', type: 'صيانة دورية', description: 'صيانة تكييف الهواء الشباك وغسيل الفلاتر وإعادة شحن الفريون', cost: 1500, performer: 'فني تبريد وتكييف موقع بورسعيد', status: 'completed' }
    ]
  }
];

export const initialEmployeeLoans: EmployeeLoan[] = [
  {
    id: 'loan-1',
    loanNo: 'LN-2026-001',
    empId: 'emp3',
    empName: 'ياسر حسن',
    department: 'العمليات والصيانة',
    jobTitle: 'مهندس صيانة أوناش رئيسي',
    amount: 18000,
    installmentsCount: 6,
    monthlyInstallment: 3000,
    reason: 'سلفة طارئة لتغطية مصاريف صيانة منزلية ومستلزمات شخصية',
    requestDate: '2026-06-10',
    startPayrollMonth: '2026-07',
    status: 'active',
    paidAmount: 3000,
    remainingAmount: 15000,
    approvalWorkflow: [
      { role: 'المشرف المباشر', roleId: '3', approvedBy: 'م. إبراهيم فوزي', approvalDate: '2026-06-11', status: 'approved', notes: 'الموظف منتظم وذو كفاءة عالية، يوصى بالقبول' },
      { role: 'مدير الموارد البشرية (HR)', roleId: '5', approvedBy: 'نوران عادل', approvalDate: '2026-06-12', status: 'approved', notes: 'تم التأكد من الراتب وعدم وجود سلف نشطة أخرى' },
      { role: 'المدير المالي (CFO)', roleId: '2', approvedBy: 'محمد خليل', approvalDate: '2026-06-13', status: 'approved', notes: 'معتمد وسيتم الخصم بواقع 3,000 ج.م شهرياً من راتب يوليو' }
    ],
    installments: [
      { installmentNo: 1, dueDate: '2026-07', amount: 3000, status: 'deducted', payrollMonth: '2026-07', deductedAt: '2026-07-01' },
      { installmentNo: 2, dueDate: '2026-08', amount: 3000, status: 'pending' },
      { installmentNo: 3, dueDate: '2026-09', amount: 3000, status: 'pending' },
      { installmentNo: 4, dueDate: '2026-10', amount: 3000, status: 'pending' },
      { installmentNo: 5, dueDate: '2026-11', amount: 3000, status: 'pending' },
      { installmentNo: 6, dueDate: '2026-12', amount: 3000, status: 'pending' }
    ]
  },
  {
    id: 'loan-2',
    loanNo: 'LN-2026-002',
    empId: 'emp6',
    empName: 'شريف عبد الحفيظ',
    department: 'الحركة واللوجستيات',
    jobTitle: 'سائق ونش ثقيل',
    amount: 12000,
    installmentsCount: 4,
    monthlyInstallment: 3000,
    reason: 'سلفة لشراء مستلزمات دراسية للأبناء ومصروفات شخصية طارئة',
    requestDate: '2026-07-02',
    startPayrollMonth: '2026-08',
    status: 'pending',
    paidAmount: 0,
    remainingAmount: 12000,
    approvalWorkflow: [
      { role: 'المشرف المباشر', roleId: '4', approvedBy: 'سامح سمير', approvalDate: '2026-07-03', status: 'approved', notes: 'السائق ملتزم بمواعيد الرحلات وتغطية البوابات' },
      { role: 'مدير الموارد البشرية (HR)', roleId: '5', approvedBy: 'نوران عادل', approvalDate: '2026-07-04', status: 'approved', notes: 'تمت مراجعة الملف الوظيفي، يوصى بالاعتماد' },
      { role: 'المدير المالي (CFO)', roleId: '2', status: 'pending', notes: 'في انتظار الاعتماد المالي والتوجيه للخصم من مسير أغسطس' }
    ],
    installments: [
      { installmentNo: 1, dueDate: '2026-08', amount: 3000, status: 'pending' },
      { installmentNo: 2, dueDate: '2026-09', amount: 3000, status: 'pending' },
      { installmentNo: 3, dueDate: '2026-10', amount: 3000, status: 'pending' },
      { installmentNo: 4, dueDate: '2026-11', amount: 3000, status: 'pending' }
    ]
  },
  {
    id: 'loan-3',
    loanNo: 'LN-2026-003',
    empId: 'emp4',
    empName: 'سامح سمير',
    department: 'الحركة واللوجستيات',
    jobTitle: 'مسؤول البوابة والحركة',
    amount: 6000,
    installmentsCount: 3,
    monthlyInstallment: 2000,
    reason: 'سلفة علاجية طارئة وتغطية مستلزمات طبية',
    requestDate: '2026-04-01',
    startPayrollMonth: '2026-05',
    status: 'completed',
    paidAmount: 6000,
    remainingAmount: 0,
    approvalWorkflow: [
      { role: 'المشرف المباشر', roleId: '1', approvedBy: 'أشرف سليمان', approvalDate: '2026-04-02', status: 'approved', notes: 'تم الاعتماد المباشر' },
      { role: 'مدير الموارد البشرية (HR)', roleId: '5', approvedBy: 'نوران عادل', approvalDate: '2026-04-02', status: 'approved', notes: 'معتمد' },
      { role: 'المدير المالي (CFO)', roleId: '2', approvedBy: 'محمد خليل', approvalDate: '2026-04-03', status: 'approved', notes: 'تمت التسوية المباشرة' }
    ],
    installments: [
      { installmentNo: 1, dueDate: '2026-05', amount: 2000, status: 'deducted', payrollMonth: '2026-05', deductedAt: '2026-05-01' },
      { installmentNo: 2, dueDate: '2026-06', amount: 2000, status: 'deducted', payrollMonth: '2026-06', deductedAt: '2026-06-01' },
      { installmentNo: 3, dueDate: '2026-07', amount: 2000, status: 'deducted', payrollMonth: '2026-07', deductedAt: '2026-07-01' }
    ]
  }
];

export const initialCustodies: EmployeeCustody[] = [
  {
    id: 'custody-fin-overdue-1',
    requestNo: 'FIN-CUST-2026-003',
    custodyType: 'financial',
    empId: 'emp1',
    empName: 'أشرف سليمان',
    department: 'تقنية المعلومات',
    assetName: 'عهدة مالية - شراء كابلات شبكات ومستلزمات سيرفر طارئة',
    serialNumber: 'FIN-2026-8803',
    category: 'financial',
    assignedDate: '2026-06-01',
    condition: 'new',
    amount: 18000,
    financialPurpose: 'تأمين أسلاك السيرفر ومقويات الإشارة لورشة الشركة الرئيسية',
    expenseCategory: 'مستلزمات تقنية',
    estimatedSettlementDate: '2026-06-20',
    settlementStatus: 'pending_settlement',
    costCenterId: 'cc1',
    costCenterName: 'المقر الرئيسي بالدقي',
    status: 'approved',
    approvalWorkflow: [
      { stepIndex: 1, role: 'المشرف المباشر', roleId: '1', approverName: 'أشرف سليمان', approvalDate: '2026-06-01', status: 'approved' },
      { stepIndex: 2, role: 'مدير الموارد البشرية (HR)', roleId: '5', approverName: 'نوران عادل', approvalDate: '2026-06-02', status: 'approved' },
      { stepIndex: 3, role: 'المدير المالي (CFO)', roleId: '2', approverName: 'محمد خليل', approvalDate: '2026-06-02', status: 'approved' }
    ],
    notes: '⚠️ تجاوزت مهلة التسوية المحددة (2026-06-20) وتتطلب استيفاء الفواتير فوراً'
  },
  {
    id: 'custody-fin-settled-1',
    requestNo: 'FIN-CUST-2026-000',
    custodyType: 'financial',
    empId: 'emp7',
    empName: 'رأفت أبو سريع',
    department: 'الحركة واللوجستيات',
    assetName: 'عهدة وقود وصيانة طارئة لطريق السويس',
    serialNumber: 'FIN-2026-8800',
    category: 'financial',
    assignedDate: '2026-07-01',
    condition: 'new',
    amount: 12000,
    settledAmount: 11850,
    financialPurpose: 'تزويد السولار ودفع رسوم الكارتة والموازين لرحلة نقل ونش 200 طن',
    expenseCategory: 'وقود ونثريات طريق',
    estimatedSettlementDate: '2026-07-15',
    settlementDate: '2026-07-12',
    settlementStatus: 'settled',
    costCenterId: 'cc3',
    costCenterName: 'قطاع الحركة واللوجستيات',
    status: 'settled',
    notes: 'تمت التسوية المستندية بالكامل وتم إرجاع المتبقي (150 ج.م) للخزينة'
  },
  {
    id: 'custody-fin-1',
    requestNo: 'FIN-CUST-2026-001',
    custodyType: 'financial',
    empId: 'emp2',
    empName: 'محمد أحمد',
    department: 'العمليات والصيانة',
    assetName: 'عهدة مالية مؤقتة - شراء قطع غيار هيدروليكية عاجلة',
    serialNumber: 'FIN-2026-8801',
    category: 'financial',
    assignedDate: '2026-07-20',
    condition: 'new',
    amount: 25000,
    financialPurpose: 'شراء فلتر ووصلات هيدروليك عالية الضغط عاجلة للونش LIEBHERR LTM 1120 من السوق المحلي',
    expenseCategory: 'قطع غيار عاجلة',
    estimatedSettlementDate: '2026-08-05',
    settlementStatus: 'pending_settlement',
    costCenterId: 'cc1',
    costCenterName: 'مشروع ميناء السخنة',
    status: 'approved',
    approvalWorkflow: [
      { stepIndex: 1, role: 'المشرف المباشر', roleId: '1', approverName: 'أشرف سليمان', approvalDate: '2026-07-20', status: 'approved', notes: 'تم التأكد من الاحتياج الفني بالموقع' },
      { stepIndex: 2, role: 'مدير الموارد البشرية (HR)', roleId: '5', approverName: 'نوران عادل', approvalDate: '2026-07-21', status: 'approved', notes: 'الطلب مستوفي الشروط التنظيمية' },
      { stepIndex: 3, role: 'المدير المالي (CFO)', roleId: '2', approverName: 'محمد خليل', approvalDate: '2026-07-21', status: 'approved', notes: 'معتمد للتنفيذ وتفريغ العهدة المالية بالخزينة' }
    ],
    notes: 'تم صرف المبلغ نقداً من الخزينة وفي انتظار تقديم الفواتير الضريبية للتسوية'
  },
  {
    id: 'custody-fin-2',
    requestNo: 'FIN-CUST-2026-002',
    custodyType: 'financial',
    empId: 'emp3',
    empName: 'ياسر حسن',
    department: 'تقنية المعلومات والتشغيل',
    assetName: 'عهدة مالية - إعاشة ومصروفات طوارئ موقع العاصمة الإدارية',
    serialNumber: 'FIN-2026-8802',
    category: 'financial',
    assignedDate: '2026-07-25',
    condition: 'new',
    amount: 15000,
    financialPurpose: 'تغطية مصروفات الانتقالات والوقود الطارئ لفريق المعاينة الفنية لموقع الإنشاءات',
    expenseCategory: 'إعاشة ومصروفات موقع',
    estimatedSettlementDate: '2026-08-10',
    settlementStatus: 'none',
    costCenterId: 'cc2',
    costCenterName: 'مشروع العاصمة الإدارية',
    status: 'pending',
    approvalWorkflow: [
      { stepIndex: 1, role: 'المشرف المباشر', roleId: '1', approverName: 'أشرف سليمان', approvalDate: '2026-07-25', status: 'approved', notes: 'موافق على خطة التحرك' },
      { stepIndex: 2, role: 'مدير الموارد البشرية (HR)', roleId: '5', status: 'pending', notes: 'قيد مراجعة الميزانية التشغيلية' },
      { stepIndex: 3, role: 'المدير المالي (CFO)', roleId: '2', status: 'pending' }
    ],
    notes: 'طلب عُهدة مالية قيد دورة الاعتماد والتصديق'
  },
  {
    id: 'custody-1',
    requestNo: 'MAT-CUST-2025-001',
    custodyType: 'material',
    empId: 'emp3',
    empName: 'ياسر حسن',
    department: 'تقنية المعلومات والتشغيل',
    assetName: 'لابتوب هندسي Dell Precision 7760',
    serialNumber: 'SN-DELL-982311',
    category: 'laptop',
    assignedDate: '2025-01-15',
    condition: 'good',
    status: 'assigned',
    notes: 'مخصص لمتابعة تشخيص البرمجيات والأعطال بالمواقع',
    fixedAssetId: 'fa3'
  },
  {
    id: 'custody-2',
    requestNo: 'MAT-CUST-2025-002',
    custodyType: 'material',
    empId: 'emp3',
    empName: 'ياسر حسن',
    department: 'العمليات والصيانة',
    assetName: 'جهاز فحص تشخيصي هيدروليكي محمول CAT ET',
    serialNumber: 'CAT-DIAG-4491',
    category: 'tool',
    assignedDate: '2025-03-10',
    condition: 'good',
    status: 'assigned',
    notes: 'أدوات فحص دورية بمواقع التشغيل'
  },
  {
    id: 'custody-3',
    requestNo: 'MAT-CUST-2024-003',
    custodyType: 'material',
    empId: 'emp6',
    empName: 'شريف عبد الحفيظ',
    department: 'الحركة واللوجستيات',
    assetName: 'هاتف ذكي مقاوم للصدمات CAT S62 (شريحة موقع)',
    serialNumber: 'SN-CAT-88120',
    category: 'mobile',
    assignedDate: '2024-11-01',
    condition: 'good',
    status: 'assigned',
    notes: 'خاص بالتواصل السريع أثناء رحلات الأوناش الثقيلة'
  },
  {
    id: 'custody-4',
    requestNo: 'MAT-CUST-2025-004',
    custodyType: 'material',
    empId: 'emp2',
    empName: 'محمد أحمد',
    department: 'العمليات والصيانة',
    assetName: 'طقم أدوات وربط هيدروليكية صلب زنة 50 طن',
    serialNumber: 'TL-RIG-0042',
    category: 'tool',
    assignedDate: '2025-02-20',
    condition: 'needs_repair',
    status: 'pending_return',
    notes: 'تستوجب إعادة تسليم وفحص السلامة الفنية بسبب استهلاك الوايرات'
  }
];

export const initialTasks: TaskAssignment[] = [
  {
    id: 'task-101',
    taskNo: 'TSK-2026-001',
    title: 'فحص منظومة الهيدروليك للونش الألمانى LIEBHERR 120T',
    description: 'إجراء معايرة ضغط طلمبة الهيدروليك الرئيسية والتأكد من عدم وجود تسريب زيت في البساتم قبل التحرك لموقع قناة السويس.',
    assignedToEmpId: 'emp3',
    assignedToEmpName: 'ياسر حسن',
    assignedBy: 'م. إبراهيم فوزي (مدير العمليات)',
    relatedType: 'maintenance',
    relatedEntityId: 'm1',
    relatedEntityName: 'صيانة ونش LIEBHERR 120T',
    dueDate: '2026-07-27',
    priority: 'high',
    status: 'in_progress'
  },
  {
    id: 'task-102',
    taskNo: 'TSK-2026-002',
    title: 'مراجعة وتوقيع تصاريح الدخول لبوابة ميناء السخنة',
    description: 'تنسيق أوراق العبور واستخراج تصاريح السائقين والونش ZOOMLION لمشروع الميناء.',
    assignedToEmpId: 'emp4',
    assignedToEmpName: 'سامح سمير',
    assignedBy: 'سامح سمير (مسؤول الحركة)',
    relatedType: 'project',
    relatedEntityId: '1',
    relatedEntityName: 'مشروع صيانة وتطوير ميناء السخنة',
    dueDate: '2026-07-26',
    priority: 'medium',
    status: 'completed',
    completedAt: '2026-07-25 14:30',
    completionNotes: 'تم استخراج تصاريح الدخول للونش وسائقيه بنجاح وتسليمها للموقع'
  },
  {
    id: 'task-103',
    taskNo: 'TSK-2026-003',
    title: 'جدولة اختبار الأحمال ومستشعر العزم للونش XCMG 80T',
    description: 'التنسيق مع هيئة السلامة والصناعة لعمل اختبار الحمل الحي LMI وإصدار شهادة المعايرة.',
    assignedToEmpId: 'emp3',
    assignedToEmpName: 'ياسر حسن',
    assignedBy: 'م. إبراهيم فوزي (مدير العمليات)',
    relatedType: 'maintenance',
    relatedEntityId: 'm2',
    relatedEntityName: 'فحص اختبارات الأمان للونش XCMG',
    dueDate: '2026-07-29',
    priority: 'high',
    status: 'pending'
  }
];

export const initialLubrications: LubricationTask[] = [
  {
    id: 'lub-1',
    craneId: 'c1',
    craneName: 'الونش الألمانى L-120T (LIEBHERR LTM 1120)',
    pointName: 'صينية التدوير وبكرات الواير الرئيسي',
    lubricantType: 'شحم ليثيوم EP-2 عالي الضغط',
    intervalHours: 250,
    lastServicedHours: 4000,
    lastServicedDate: '2026-07-10',
    status: 'overdue'
  },
  {
    id: 'lub-2',
    craneId: 'c2',
    craneName: 'الونش الصيني XCMG-80T',
    pointName: 'بساتم الركائز الهيدروليكية ومحاور التوجيه',
    lubricantType: 'شحم مقاوم للماء ISO VG 320',
    intervalHours: 250,
    lastServicedHours: 3000,
    lastServicedDate: '2026-07-15',
    status: 'due_soon'
  },
  {
    id: 'lub-3',
    craneId: 'c3',
    craneName: 'ونش كاتربيلر مجنزر CAT-150T',
    pointName: 'جنازير الكاتينة وبكرات البوم الشبكي',
    lubricantType: 'شحم جرافيت ثقيل Heavy Duty',
    intervalHours: 250,
    lastServicedHours: 5550,
    lastServicedDate: '2026-07-01',
    status: 'completed'
  }
];

export const initialSparePartsRequests: SparePartsRequest[] = [
  {
    id: 'spr-1',
    requestNo: 'SPR-2026-001',
    maintenanceOrderId: 'm1',
    maintenanceOrderTitle: 'صيانة ونش LIEBHERR 120T - تسريب هيدروليك',
    craneName: 'الونش الألمانى L-120T (LIEBHERR LTM 1120)',
    requestedBy: 'ياسر حسن (مهندس الصيانة)',
    requestDate: '2026-07-25',
    items: [
      { itemId: 'inv1', itemName: 'زيت هيدروليك ISO VG 68', itemCode: 'OIL-HYD-68', quantity: 2, unitPrice: 4500, availableQty: 18 },
      { itemId: 'inv2', itemName: 'فلتر زيت هيدروليك لشركة liebherr', itemCode: 'FLT-HYD-LBH', quantity: 3, unitPrice: 1200, availableQty: 12 }
    ],
    totalCost: 12600,
    status: 'pending',
    notes: 'مطلوب بصورة عاجلة لاستكمال الصيانة قبل التوجه لموقع الميناء'
  },
  {
    id: 'spr-2',
    requestNo: 'SPR-2026-002',
    maintenanceOrderId: 'm2',
    maintenanceOrderTitle: 'عمرة فرامل واستبدال تيل ونش XCMG 80T',
    craneName: 'الونش الصيني XCMG-80T',
    requestedBy: 'ياسر حسن (مهندس الصيانة)',
    requestDate: '2026-07-20',
    items: [
      { itemId: 'inv3', itemName: 'طقم تيل فرامل ونش ثقيل', itemCode: 'BRK-PAD-HD', quantity: 2, unitPrice: 3800, availableQty: 5 }
    ],
    totalCost: 7600,
    status: 'fulfilled',
    approvedBy: 'م. إبراهيم فوزي',
    approvedDate: '2026-07-21',
    notes: 'تمت الموافقة وخصم الكمية تلقائياً من مخزن قطع الغيار الرئيسي'
  }
];

export const initialAssetBudgets: AssetMaintenanceBudget[] = [
  {
    id: 'amb-1',
    year: 2026,
    targetType: 'crane',
    targetId: 'c1',
    targetNameAr: 'Demag AC 250-5 (ونش ديمباج تلسكوبي 250 طن)',
    category: 'أوناش تلسكوبية',
    annualBudget: 250000,
    notes: 'ميزانية الصيانة الوقائية والزيوت وحبال الفولاذ'
  },
  {
    id: 'amb-2',
    year: 2026,
    targetType: 'crane',
    targetId: 'c2',
    targetNameAr: 'Liebherr LTM 1100 (ونش ليبهير 100 طن)',
    category: 'أوناش تلسكوبية',
    annualBudget: 180000,
    notes: 'صيانة دورية بموقع ميناء الإسكندرية'
  },
  {
    id: 'amb-3',
    year: 2026,
    targetType: 'crane',
    targetId: 'c3',
    targetNameAr: 'Terex CC 2400-1 (ونش جنزير تيريكس 400 طن)',
    category: 'أوناش مجنرزة',
    annualBudget: 350000,
    notes: 'تتضمن معايرة الحساسات وعمرة الجنازير السنوية'
  },
  {
    id: 'amb-4',
    year: 2026,
    targetType: 'crane',
    targetId: 'c4',
    targetNameAr: 'Liebherr LR 1600/2 (ونش جنزير ليبهير 600 طن)',
    category: 'أوناش مجنرزة',
    annualBudget: 400000,
    notes: 'العمرات الهيدروليكية والتجديد الشامل'
  },
  {
    id: 'amb-5',
    year: 2026,
    targetType: 'category',
    targetId: 'cat-workshop',
    targetNameAr: 'معدات الورشة المركزية ومركبات الخدمة',
    category: 'معدات الورشة',
    annualBudget: 120000,
    notes: 'صيانة سيارات الدعم الفني وتجهيزات الورشة'
  }
];

