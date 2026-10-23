export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  jobTitle: string;
  isActive: boolean;
  roleId: string;
  roleName: string;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  isSystem: boolean;
  isActive: boolean;
  userCount: number;
}

export interface Crane {
  id: string;
  code: string;
  nameAr: string;
  model: string;
  capacity: number; // in tons
  status: 'running' | 'idle' | 'maintenance';
  operatorName: string;
  plateNumber: string;
  lat: number;
  lng: number;
  speed: number;
  fuelLevel: number; // percentage
}

export interface Vehicle {
  id: string;
  code: string;
  type: string;
  plateNumber: string;
  driverName: string;
  status: 'active' | 'on_trip' | 'maintenance';
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  status: 'active' | 'on_trip' | 'vacation';
}

export interface CostCenter {
  id: string;
  code: string;
  name?: string;
  nameAr: string;
  nameEn: string;
  department: string;
  budget: number;
  usedBudget: number;
  isActive: boolean;
  managerName: string;
}

export interface JournalEntryLine {
  accountName: string;
  debit: number;
  credit: number;
  costCenterId?: string;
  costCenterName?: string;
}

export interface JournalEntry {
  id: string;
  docNo: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  status: 'pending' | 'approved' | 'rejected';
  costCenterId?: string;
  costCenterName?: string;
  lines?: JournalEntryLine[];
  currency?: string;
  exchangeRate?: number;
}

export interface AccountNode {
  id: string;
  code: string;
  nameAr: string;
  balance: number;
  type: 'assets' | 'liabilities' | 'equity' | 'revenues' | 'expenses';
  children?: AccountNode[];
}

export interface DocumentAttachment {
  id: string;
  name: string;
  type: 'contract_scan' | 'invoice_scan' | 'general_scan' | string;
  imageUrl: string;
  scannedAt: string;
  extractedText?: string;
  extractedData?: {
    documentNo?: string;
    customerName?: string;
    date?: string;
    amount?: number;
    tax?: number;
    startDate?: string;
    endDate?: string;
    craneName?: string;
    summary?: string;
    items?: Array<{
      description: string;
      qty: number;
      unitPrice: number;
      total: number;
    }>;
  };
}

export interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  dueDate?: string;
  customerName: string;
  amount: number;
  tax: number;
  total: number;
  status: 'paid' | 'partially_paid' | 'unpaid';
  items: InvoiceItem[];
  currency?: string;
  exchangeRate?: number;
  attachments?: DocumentAttachment[];
}

export interface Contract {
  id: string;
  contractNo: string;
  customerName: string;
  craneId: string;
  craneName: string;
  startDate: string;
  endDate: string;
  value: number;
  status: 'active' | 'completed' | 'suspended';
  attachments?: DocumentAttachment[];
}

export interface MaintenanceOrder {
  id: string;
  orderNo: string;
  craneId: string;
  craneName: string;
  type: 'preventive' | 'corrective';
  cost: number;
  description: string;
  date: string;
  status: 'completed' | 'in_progress' | 'pending';
  faultImage?: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  nameAr: string;
  category: string;
  unit: string;
  currentQty: number;
  minQty: number;
  unitPrice: number;
  warehouseName: string;
}

export interface Tender {
  id: string;
  code: string;
  title: string;
  closingDate: string;
  bidAmount: number;
  status: 'pending' | 'won' | 'lost' | 'submitted';
}

export interface Trip {
  id: string;
  tripNo: string;
  craneId: string;
  craneName: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehicleCode: string;
  departureGate: string;
  destination: string;
  departureTime: string;
  arrivalTime?: string;
  status: 'active' | 'completed';
}

export interface GatePass {
  id: string;
  passNo: string;
  type: 'out' | 'in';
  craneId: string;
  craneName: string;
  driverName: string;
  timestamp: string;
  hasScanFail: boolean;
  missingItems: string[];
  checklist: { [key: string]: boolean };
}

export interface AttendanceLog {
  id: string;
  empName: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'leave';
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  salary: number;
  hireDate: string;
  status: 'active' | 'suspended' | 'vacation';
  nationalId: string;
}

export interface LeaveRequest {
  id: string;
  empName: string;
  type: 'annual' | 'sick' | 'unpaid' | 'emergency';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Payroll {
  id: string;
  empName: string;
  month: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'draft' | 'paid';
  loanDeduction?: number;
  loanNo?: string;
}

export interface LoanApprovalStep {
  role: string;
  roleId?: string;
  approvedBy?: string;
  approvalDate?: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export interface LoanInstallment {
  installmentNo: number;
  dueDate: string;
  amount: number;
  status: 'pending' | 'deducted' | 'deferred';
  payrollMonth?: string;
  deductedAt?: string;
  notes?: string;
}

export interface EmployeeLoan {
  id: string;
  loanNo: string;
  empId: string;
  empName: string;
  department: string;
  jobTitle: string;
  amount: number;
  installmentsCount: number;
  monthlyInstallment: number;
  reason: string;
  requestDate: string;
  startPayrollMonth: string;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'rejected';
  approvalWorkflow: LoanApprovalStep[];
  installments: LoanInstallment[];
  paidAmount: number;
  remainingAmount: number;
  notes?: string;
}

export interface ApprovalRequest {
  id: string;
  type: 'save' | 'edit' | 'delete';
  screenName: string;
  recordId: string;
  recordSummary: string;
  requestedByName: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  approverName?: string;
  actionDate?: string;
  notes?: string;
}

export interface ApprovalAuthority {
  id: string;
  userName: string;
  screenName: string;
  canApproveSave: boolean;
  canApproveDelete: boolean;
  canApproveEdit: boolean;
  approvalLimit?: number;
  isActive: boolean;
}

export interface ScreenModule {
  id: string;
  name: string;
  nameAr: string;
  module: string;
}

export interface AuditLog {
  id: string;
  timestamp: string; // ISO format or YYYY-MM-DD HH:MM:SS
  userName: string; // Actor
  userRole: string; // Actor's role
  ipAddress: string; // Source IP
  actionType: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'approval' | 'export' | 'security_change';
  severity: 'info' | 'warning' | 'critical';
  module: string; // System module (e.g. الحسابات, الصيانة, شؤون الموظفين, الحركة, المخازن, المستخدمين والصلاحيات)
  description: string; // Action description
  details?: string; // Payload or extra description
}

export interface ProjectMilestone {
  id: string;
  title: string;
  dueDate: string;
  status: 'completed' | 'in_progress' | 'delayed' | 'upcoming';
}

export interface ProjectTimelineData {
  contractId: string;
  projectName: string;
  manager: string;
  location: string;
  progress: number;
  milestones: ProjectMilestone[];
}

export interface AssetMaintenanceLog {
  id: string;
  date: string;
  type: string; // صيانة دورية، إصلاح طارئ، فحص ومعايرة
  description: string;
  cost: number;
  performer: string; // الجهة المنفذة
  status: 'completed' | 'pending';
}

export interface FixedAsset {
  id: string;
  code: string;
  nameAr: string;
  category: 'workshop_machinery' | 'admin_vehicles' | 'it_networks' | 'office_furniture' | 'other';
  purchaseDate: string;
  purchaseCost: number;
  salvageValue: number; // القيمة التخريدية
  usefulLife: number; // العمر الإنتاجي بالسنوات
  depreciationMethod: 'straight_line' | 'declining_balance';
  decliningRate?: number; // معدل الإهلاك المتناقص (e.g., 20%)
  location: string; // موقع التواجد
  currentValue: number; // القيمة الدفترية الحالية
  accumulatedDepreciation: number; // الإهلاك المتراكم
  maintenanceLog: AssetMaintenanceLog[];
  lastInventoryDate?: string; // تاريخ آخر جرد معتمد
}

// ----------------------------------------------------
// NEW MODULES: Treasury, Checks, Partners & Messages
// ----------------------------------------------------

export interface TreasuryTransaction {
  id: string;
  docNo: string;
  date: string;
  type: 'cash_in' | 'cash_out';
  amount: number;
  vaultId: string;
  vaultName: string;
  recipientOrPayer: string;
  description: string;
  category: 'customer_payment' | 'supplier_payment' | 'expense' | 'revenue' | 'other';
  costCenterId?: string;
  costCenterName?: string;
}

export interface CheckRecord {
  id: string;
  checkNo: string;
  bankName: string;
  dueDate: string;
  amount: number;
  type: 'issued' | 'received'; // issued = صادر, received = وارد
  partnerName: string;
  status: 'portfolio' | 'deposited' | 'cashed' | 'bounced';
  notes?: string;
  costCenterId?: string;
  costCenterName?: string;
  issueDate?: string;
  accountNo?: string;
  autoCollect?: boolean;
  targetVaultId?: string;
  targetVaultName?: string;
  drawerName?: string;
  beneficiaryName?: string;
  reminderSent?: boolean;
  scheduledCollectionDate?: string;
  postponedHistory?: Array<{ oldDate: string; newDate: string; reason: string; date: string }>;
}

export interface PartnerAccount {
  id: string;
  name: string;
  type: 'customer' | 'supplier';
  phone: string;
  email: string;
  balance: number; // positive = debit (due from customer), negative = credit (due to supplier/advance)
  commercialRegister?: string;
  taxNumber?: string;
  address?: string;
}

export interface PartnerTransaction {
  id: string;
  partnerId: string;
  date: string;
  type: 'invoice' | 'payment' | 'check' | 'credit_note' | 'debit_note';
  reference: string;
  debit: number;
  credit: number;
  runningBalance: number;
  description: string;
}

export interface UserMessage {
  id: string;
  userId: string; // Recipient User ID (e.g. '1', '2' or 'all')
  sender: string;
  title: string;
  message: string;
  timestamp: string;
  category: 'alert' | 'task' | 'reply' | 'order';
  isRead: boolean;
  actionUrl?: string; // For redirecting to module
  actionText?: string;
  taskStatus?: 'pending' | 'completed' | 'none';
}

export interface CustodyApprovalStep {
  stepIndex: number;
  role: string;
  roleId?: string;
  approverName?: string;
  approvalDate?: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export interface EmployeeCustody {
  id: string;
  requestNo?: string;
  custodyType?: 'material' | 'financial'; // عُهدة عينية أو مالية
  empId: string;
  empName: string;
  department?: string;
  // Material Custody Fields
  assetName: string;
  serialNumber: string;
  category: 'laptop' | 'mobile' | 'tool' | 'car' | 'other' | 'financial';
  assignedDate: string;
  returnDate?: string;
  condition: 'new' | 'good' | 'damaged' | 'needs_repair';
  // Financial Custody Fields
  amount?: number;
  financialPurpose?: string;
  expenseCategory?: string; // صيانة طارئة، إعاشة، وقود، قطع غيار عاجلة، نثرية
  estimatedSettlementDate?: string;
  settlementDate?: string;
  settlementStatus?: 'pending_settlement' | 'settled' | 'none';
  settledAmount?: number;
  settlementNotes?: string;
  costCenterId?: string;
  costCenterName?: string;
  // Status & Approval Workflow
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'assigned' | 'returned' | 'pending_return' | 'settled';
  approvalWorkflow?: CustodyApprovalStep[];
  notes?: string;
  fixedAssetId?: string;
}

export interface TaskAssignment {
  id: string;
  taskNo: string;
  title: string;
  description: string;
  assignedToEmpId: string;
  assignedToEmpName: string;
  assignedBy: string;
  relatedType: 'project' | 'maintenance' | 'general';
  relatedEntityId?: string;
  relatedEntityName?: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completionNotes?: string;
  completedAt?: string;
}

export interface LubricationTask {
  id: string;
  craneId: string;
  craneName: string;
  pointName: string;
  lubricantType: string;
  intervalHours: number;
  lastServicedHours: number;
  lastServicedDate: string;
  status: 'overdue' | 'due_soon' | 'completed';
}

export interface LubricationSchedule {
  id: string;
  craneId: string;
  craneName: string;
  craneModel: string;
  currentOperatingHours: number;
  lastLubricationHours: number;
  intervalHours: number;
  nextLubricationHours: number;
  lubricantType: string;
  lubricationPoints: string[];
  status: 'due' | 'upcoming' | 'completed';
  lastDoneDate?: string;
  assignedTechnician?: string;
}

export interface SparePartsRequest {
  id: string;
  requestNo: string;
  maintenanceOrderId: string;
  maintenanceOrderTitle?: string;
  craneName: string;
  partItemId?: string;
  partName?: string;
  quantityRequested?: number;
  requestedBy: string;
  requestDate: string;
  items?: Array<{
    itemId: string;
    itemName: string;
    itemCode: string;
    quantity: number;
    unitPrice: number;
    availableQty: number;
  }>;
  totalCost?: number;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  approvedBy?: string;
  approvedDate?: string;
  notes?: string;
}

export interface AssetMaintenanceBudget {
  id: string;
  year: number;
  targetType: 'crane' | 'category' | 'fixed_asset';
  targetId: string;
  targetNameAr: string;
  annualBudget: number; // الميزانية المعتمدة
  notes?: string;
  category?: string;
}



