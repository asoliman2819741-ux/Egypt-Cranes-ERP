import React, { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { exportTableToPDF } from '../utils/pdfExport';
import { 
  Employee, AttendanceLog, LeaveRequest, Payroll, Driver, User,
  EmployeeLoan, EmployeeCustody, TaskAssignment, CostCenter
} from '../types';
import { 
  Users, UserPlus, Fingerprint, CalendarCheck, Coins, Search, Plus, 
  Trash2, ShieldCheck, AlertCircle, CheckCircle2, XCircle, Clock, 
  TrendingUp, ArrowUpRight, FileCheck, Landmark, Check, X, Phone, Mail, 
  UserCheck, Download, Printer, Filter, Briefcase, DollarSign, Calendar,
  Activity, ArrowDownRight, RefreshCw, Send, Sparkles, FileSpreadsheet,
  HandCoins, Laptop, CheckSquare, QrCode, AlertTriangle, FileText, ShieldAlert, ListTodo, Eye, Receipt, Banknote,
  BarChart3, PieChart, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HRModuleProps {
  currentUser: User;
  employees: Employee[];
  onAddEmployee: (emp: Employee) => void;
  onUpdateEmployee: (id: string, updated: Partial<Employee>) => void;
  attendance: AttendanceLog[];
  onAddAttendance: (log: AttendanceLog) => void;
  onUpdateAttendance: (id: string, updated: Partial<AttendanceLog>) => void;
  leaveRequests: LeaveRequest[];
  onAddLeave: (req: LeaveRequest) => void;
  onUpdateLeave: (id: string, updated: Partial<LeaveRequest>) => void;
  payrolls: Payroll[];
  onAddPayroll: (pay: Payroll) => void;
  onUpdatePayroll: (id: string, updated: Partial<Payroll>) => void;
  drivers: Driver[];
  onUpdateDriverStatus: (name: string, status: 'active' | 'on_trip' | 'vacation') => void;
  loans?: EmployeeLoan[];
  onAddLoan?: (loan: EmployeeLoan) => void;
  onUpdateLoan?: (id: string, updated: Partial<EmployeeLoan>) => void;
  onApproveLoanStep?: (loanId: string, stepIndex: number, approverName: string, notes?: string, isRejected?: boolean) => void;
  custodies?: EmployeeCustody[];
  onAddCustody?: (c: EmployeeCustody) => void;
  onUpdateCustody?: (id: string, updated: Partial<EmployeeCustody>) => void;
  onDeleteCustody?: (id: string) => void;
  onApproveCustodyStep?: (custodyId: string, stepIndex: number, approverName: string, notes?: string, isRejected?: boolean) => void;
  onSettleFinancialCustody?: (custodyId: string, settledAmount: number, notes?: string) => void;
  costCenters?: CostCenter[];
  tasks?: TaskAssignment[];
  onAddTask?: (t: TaskAssignment) => void;
  onUpdateTask?: (id: string, updated: Partial<TaskAssignment>) => void;
}

export default function HRModule({
  currentUser,
  employees,
  onAddEmployee,
  onUpdateEmployee,
  attendance,
  onAddAttendance,
  onUpdateAttendance,
  leaveRequests,
  onAddLeave,
  onUpdateLeave,
  payrolls,
  onAddPayroll,
  onUpdatePayroll,
  drivers,
  onUpdateDriverStatus,
  loans = [],
  onAddLoan,
  onUpdateLoan,
  onApproveLoanStep,
  custodies = [],
  onAddCustody,
  onUpdateCustody,
  onDeleteCustody,
  onApproveCustodyStep,
  onSettleFinancialCustody,
  costCenters = [],
  tasks = [],
  onAddTask,
  onUpdateTask
}: HRModuleProps) {
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'employees' | 'attendance' | 'leaves' | 'payroll' | 'loans' | 'custodies' | 'tasks'>('employees');
  
  // Search and general filter states
  const [empSearch, setEmpSearch] = useState('');
  const [empDeptFilter, setEmpDeptFilter] = useState('all');
  const [empStatusFilter, setEmpStatusFilter] = useState('all');
  
  const [attSearch, setAttSearch] = useState('');
  const [attStatusFilter, setAttStatusFilter] = useState('all');
  const [attDateFilter, setAttDateFilter] = useState('');

  const [leaveSearch, setLeaveSearch] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('all');

  const [paySearch, setPaySearch] = useState('');
  const [payMonthFilter, setPayMonthFilter] = useState('all');
  const [payStatusFilter, setPayStatusFilter] = useState('all');

  // Loans State & Filters
  const [loanSearch, setLoanSearch] = useState('');
  const [loanStatusFilter, setLoanStatusFilter] = useState('all');
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  const [newLoanEmpId, setNewLoanEmpId] = useState('');
  const [newLoanAmount, setNewLoanAmount] = useState<number>(10000);
  const [newLoanInstallments, setNewLoanInstallments] = useState<number>(5);
  const [newLoanStartMonth, setNewLoanStartMonth] = useState('2026-08');
  const [newLoanReason, setNewLoanReason] = useState('');

  // Custody State & Filters
  const [custodySearch, setCustodySearch] = useState('');
  const [custodyCategoryFilter, setCustodyCategoryFilter] = useState('all');
  const [custodyTypeFilter, setCustodyTypeFilter] = useState<'all' | 'financial' | 'material' | 'workflow'>('all');
  
  // Custody Consumption & Auditing Reports State
  const [custodySubView, setCustodySubView] = useState<'list' | 'reports'>('list');
  const [custodyReportStatusFilter, setCustodyReportStatusFilter] = useState<'all' | 'open' | 'settled' | 'overdue'>('all');
  const [custodyReportCategoryFilter, setCustodyReportCategoryFilter] = useState<'all' | 'financial' | 'material'>('all');
  const [custodyReportDeptFilter, setCustodyReportDeptFilter] = useState<string>('all');
  const [custodyReportSearch, setCustodyReportSearch] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  
  const [showAddCustodyModal, setShowAddCustodyModal] = useState(false);
  const [newCustodyType, setNewCustodyType] = useState<'financial' | 'material'>('financial');
  const [newCustodyEmpId, setNewCustodyEmpId] = useState('');
  const [newCustodyAssetName, setNewCustodyAssetName] = useState('');
  const [newCustodySerial, setNewCustodySerial] = useState('');
  const [newCustodyCategory, setNewCustodyCategory] = useState<EmployeeCustody['category']>('laptop');
  const [newCustodyCondition, setNewCustodyCondition] = useState<EmployeeCustody['condition']>('new');
  const [newCustodyNotes, setNewCustodyNotes] = useState('');
  
  // Financial Custody Form Inputs
  const [newCustodyAmount, setNewCustodyAmount] = useState<number>(10000);
  const [newCustodyPurpose, setNewCustodyPurpose] = useState('');
  const [newCustodyExpenseCat, setNewCustodyExpenseCat] = useState('قطع غيار عاجلة');
  const [newCustodyCostCenterId, setNewCustodyCostCenterId] = useState('');
  const [newCustodyEstSettlementDate, setNewCustodyEstSettlementDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });

  // Workflow & Receipt Modals
  const [selectedCustodyForReceipt, setSelectedCustodyForReceipt] = useState<EmployeeCustody | null>(null);
  const [selectedCustodyForApproval, setSelectedCustodyForApproval] = useState<EmployeeCustody | null>(null);
  const [approvalNoteInput, setApprovalNoteInput] = useState('');
  const [selectedCustodyForSettlement, setSelectedCustodyForSettlement] = useState<EmployeeCustody | null>(null);
  const [settlementActualAmount, setSettlementActualAmount] = useState<number>(0);
  const [settlementNotes, setSettlementNotes] = useState('');

  // Tasks State & Filters
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskEmpId, setNewTaskEmpId] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskAssignment['priority']>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskRelatedType, setNewTaskRelatedType] = useState<TaskAssignment['relatedType']>('general');
  const [newTaskRelatedEntity, setNewTaskRelatedEntity] = useState('');

  // Modals & form inputs
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [showAddLeaveModal, setShowAddLeaveModal] = useState(false);
  const [showGenPayrollModal, setShowGenPayrollModal] = useState(false);
  
  // New Employee State
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('العمليات والصيانة');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpSalary, setNewEmpSalary] = useState(7500);
  const [newEmpNationalId, setNewEmpNationalId] = useState('');
  const [newEmpHireDate, setNewEmpHireDate] = useState(new Date().toISOString().split('T')[0]);

  // New Leave Request State
  const [newLeaveEmp, setNewLeaveEmp] = useState('');
  const [newLeaveType, setNewLeaveType] = useState<'annual' | 'sick' | 'unpaid' | 'emergency'>('annual');
  const [newLeaveStart, setNewLeaveStart] = useState('');
  const [newLeaveEnd, setNewLeaveEnd] = useState('');
  const [newLeaveReason, setNewLeaveReason] = useState('');

  // Payroll input state
  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState('2026-07');

  // Simulated export notifications/progress
  const [exportNotification, setExportNotification] = useState<{show: boolean; message: string; filename: string} | null>(null);

  // Check if authorized
  const isHRAdmin = currentUser.roleId === '1' || currentUser.roleId === '5'; // Admin or HR

  const departments = [
    'العمليات والصيانة',
    'الحركة واللوجستيات',
    'المالية',
    'الموارد البشرية',
    'تقنية المعلومات',
    'العقود والمناقصات'
  ];

  // CSV Exporter helper with Arabic letter support (UTF-8 BOM)
  const handleExportData = (data: any[], headers: string[], keys: string[], fileName: string) => {
    if (data.length === 0) {
      alert('لا توجد بيانات متاحة للتصدير حالياً');
      return;
    }
    
    // Create animated overlay feedback
    setExportNotification({
      show: true,
      message: 'جاري معالجة البيانات وتوليد التقرير المعتمد...',
      filename: `${fileName}.csv`
    });

    setTimeout(() => {
      // Build CSV with BOM
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          keys.map(key => {
            const val = row[key] !== undefined ? row[key] : '';
            return `"${String(val).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportNotification(prev => prev ? { ...prev, message: 'تم تحميل الملف بنجاح كتقرير Excel متوافق!' } : null);
      
      setTimeout(() => {
        setExportNotification(null);
      }, 1500);
    }, 1200);
  };

  // 1. Employee Management Handlers
  const handleCreateEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName || !newEmpRole || !newEmpNationalId || !newEmpPhone) {
      alert('يرجى تعبئة الحقول الإلزامية التي تحمل علامة (*)');
      return;
    }

    const createdEmp: Employee = {
      id: 'emp-' + Math.random().toString(36).substring(2, 9),
      name: newEmpName,
      role: newEmpRole,
      department: newEmpDept,
      phone: newEmpPhone,
      email: newEmpEmail || `${newEmpName.replace(/\s+/g, '.')}@egyptcranes.com`,
      salary: Number(newEmpSalary),
      hireDate: newEmpHireDate,
      status: 'active',
      nationalId: newEmpNationalId
    };

    onAddEmployee(createdEmp);
    setShowAddEmpModal(false);

    // Reset Form
    setNewEmpName('');
    setNewEmpRole('');
    setNewEmpPhone('');
    setNewEmpEmail('');
    setNewEmpNationalId('');
    setNewEmpSalary(7500);
  };

  const handleToggleStatus = (id: string, currentStatus: 'active' | 'suspended' | 'vacation') => {
    if (!isHRAdmin) {
      alert('عذراً، صلاحياتك لا تسمح بتغيير الحالة الأمنية للموظفين');
      return;
    }
    const nextStatus: 'active' | 'suspended' = currentStatus === 'active' ? 'suspended' : 'active';
    onUpdateEmployee(id, { status: nextStatus });

    // Link back to driver's dispatch eligibility
    const emp = employees.find(e => e.id === id);
    if (emp && emp.role.includes('سائق')) {
      onUpdateDriverStatus(emp.name, nextStatus === 'active' ? 'active' : 'vacation');
    }
  };

  // 2. Attendance Simulation Handlers
  const handleInstantAttendance = (empName: string) => {
    const today = new Date().toISOString().split('T')[0];
    const hours = new Date().getHours().toString().padStart(2, '0');
    const minutes = new Date().getMinutes().toString().padStart(2, '0');
    const checkInTime = `${hours}:${minutes}`;

    // Avoid duplicate checkin
    const alreadyExists = attendance.some(a => a.empName === empName && a.date === today);
    if (alreadyExists) {
      alert(`الموظف ${empName} مسجل له بصمة حضور مسبقاً لهذا اليوم.`);
      return;
    }

    const isLate = Number(hours) > 8 || (Number(hours) === 8 && Number(minutes) > 30);
    const newLog: AttendanceLog = {
      id: 'att-' + Math.random().toString(36).substring(2, 9),
      empName,
      date: today,
      checkIn: checkInTime,
      status: isLate ? 'late' : 'present'
    };

    onAddAttendance(newLog);
    alert(`تم رصد البصمة البيومترية بنجاح لـ ${empName} في تمام الساعة ${checkInTime}`);
  };

  const handleInstantCheckOut = (logId: string) => {
    const hours = new Date().getHours().toString().padStart(2, '0');
    const minutes = new Date().getMinutes().toString().padStart(2, '0');
    const checkOutTime = `${hours}:${minutes}`;

    onUpdateAttendance(logId, { checkOut: checkOutTime });
  };

  // 3. Leave Request Handlers
  const handleCreateLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaveEmp || !newLeaveStart || !newLeaveEnd) {
      alert('يرجى تحديد الموظف وفترة الإجازة بدقة');
      return;
    }

    const start = new Date(newLeaveStart);
    const end = new Date(newLeaveEnd);
    if (end < start) {
      alert('خطأ: تاريخ نهاية الإجازة لا يصح أن يسبق تاريخ البداية.');
      return;
    }

    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const request: LeaveRequest = {
      id: 'leave-' + Math.random().toString(36).substring(2, 9),
      empName: newLeaveEmp,
      type: newLeaveType,
      startDate: newLeaveStart,
      endDate: newLeaveEnd,
      days: diffDays,
      reason: newLeaveReason || 'إجازة شخصية اعتيادية',
      status: 'pending'
    };

    onAddLeave(request);
    setShowAddLeaveModal(false);
    
    // Reset Form
    setNewLeaveEmp('');
    setNewLeaveStart('');
    setNewLeaveEnd('');
    setNewLeaveReason('');
  };

  const handleLeaveDecision = (id: string, decision: 'approved' | 'rejected') => {
    if (!isHRAdmin) {
      alert('ليس لديك صلاحيات اعتماد طلبات الإجازات');
      return;
    }

    onUpdateLeave(id, { status: decision });
    const leave = leaveRequests.find(l => l.id === id);
    if (leave && decision === 'approved') {
      const emp = employees.find(e => e.name === leave.empName);
      if (emp) {
        onUpdateEmployee(emp.id, { status: 'vacation' });
        if (emp.role.includes('سائق')) {
          onUpdateDriverStatus(emp.name, 'vacation');
        }
      }
    }
  };

  // 4. Payroll Handlers
  const handleGeneratePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if payroll already generated
    const exists = payrolls.some(p => p.month === selectedPayrollMonth);
    if (exists) {
      if (!confirm(`مسيرات شهر ${selectedPayrollMonth} تم إصدارها مسبقاً. هل تود دمج الموظفين الجدد؟`)) {
        return;
      }
    }

    employees.forEach(emp => {
      // Don't duplicate for same month
      const isAlreadyPaid = payrolls.some(p => p.empName === emp.name && p.month === selectedPayrollMonth);
      if (isAlreadyPaid) return;

      const basic = emp.salary;
      // Bonus: engineers/managers get higher allowances, drivers have safety bonuses
      const allowance = emp.role.includes('سائق') ? 1400 : emp.role.includes('مهندس') || emp.role.includes('مدير') ? 2200 : 900;
      const deduction = emp.status === 'suspended' ? basic * 0.4 : 0;

      // Calculate loan deduction if active loan exists
      const empActiveLoan = loans.find(l => l.empId === emp.id && (l.status === 'active' || l.status === 'approved'));
      let loanDeductionAmount = 0;
      let loanNoRef: string | undefined = undefined;

      if (empActiveLoan && empActiveLoan.remainingAmount > 0) {
        loanDeductionAmount = Math.min(empActiveLoan.monthlyInstallment, empActiveLoan.remainingAmount);
        loanNoRef = empActiveLoan.loanNo;
      }

      const totalDeductions = deduction + loanDeductionAmount;
      const net = Math.max(0, basic + allowance - totalDeductions);

      const payrollRecord: Payroll = {
        id: 'pay-' + Math.random().toString(36).substring(2, 9),
        empName: emp.name,
        month: selectedPayrollMonth,
        basicSalary: basic,
        allowances: allowance,
        deductions: totalDeductions,
        netSalary: net,
        status: 'draft',
        loanDeduction: loanDeductionAmount > 0 ? loanDeductionAmount : undefined,
        loanNo: loanNoRef
      };

      onAddPayroll(payrollRecord);
    });

    setShowGenPayrollModal(false);
    alert(`تم إصدار مسيرات الرواتب لشهر ${selectedPayrollMonth} بنجاح كمسودة مع احتساب استقطاعات السلف المباشرة!`);
  };

  // 5. Loan Handlers
  const handleCreateLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === newLoanEmpId);
    if (!emp) {
      alert('يرجى اختيار الموظف صاحب طلب السلفة');
      return;
    }

    const monthlyInst = Math.round(newLoanAmount / (newLoanInstallments || 1));
    const loanNo = `LN-2026-${String(loans.length + 1).padStart(3, '0')}`;

    const installments = [];
    for (let i = 1; i <= newLoanInstallments; i++) {
      installments.push({
        installmentNo: i,
        dueDate: `2026-${String(7 + i).padStart(2, '0')}`,
        amount: monthlyInst,
        status: 'pending' as const
      });
    }

    const newLoan: EmployeeLoan = {
      id: 'loan-' + Math.random().toString(36).substring(2, 9),
      loanNo,
      empId: emp.id,
      empName: emp.name,
      department: emp.department,
      jobTitle: emp.role,
      amount: Number(newLoanAmount),
      installmentsCount: Number(newLoanInstallments),
      monthlyInstallment: monthlyInst,
      reason: newLoanReason || 'سلفة شخصية طارئة',
      requestDate: new Date().toISOString().split('T')[0],
      startPayrollMonth: newLoanStartMonth,
      status: 'pending',
      paidAmount: 0,
      remainingAmount: Number(newLoanAmount),
      approvalWorkflow: [
        { role: 'المشرف المباشر', status: 'pending' },
        { role: 'مدير الموارد البشرية (HR)', status: 'pending' },
        { role: 'المدير المالي (CFO)', status: 'pending' }
      ],
      installments
    };

    if (onAddLoan) onAddLoan(newLoan);
    setShowAddLoanModal(false);
    setNewLoanEmpId('');
    setNewLoanReason('');
    alert(`تم تقديم طلب السلفة رقم ${loanNo} بنجاح وإدراجه في دورة الاعتماد المالي!`);
  };

  // 6. Custody Handlers
  const handleCreateCustodySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === newCustodyEmpId);
    if (!emp) {
      alert('يرجى اختيار الموظف صاحب الطلب / المستلم للعهدة');
      return;
    }

    const isFinancial = newCustodyType === 'financial';
    const cc = costCenters.find(c => c.id === newCustodyCostCenterId);

    const newCustody: EmployeeCustody = {
      id: 'custody-' + Math.random().toString(36).substring(2, 9),
      requestNo: isFinancial 
        ? `FIN-CUST-2026-${String(custodies.length + 1).padStart(3, '0')}`
        : `MAT-CUST-2026-${String(custodies.length + 1).padStart(3, '0')}`,
      custodyType: newCustodyType,
      empId: emp.id,
      empName: emp.name,
      department: emp.department,
      assetName: isFinancial ? `عهدة مالية - ${newCustodyPurpose || newCustodyExpenseCat}` : newCustodyAssetName,
      serialNumber: isFinancial ? `FIN-${Date.now().toString().slice(-6)}` : (newCustodySerial || `SN-${Math.floor(Math.random() * 899999 + 100000)}`),
      category: isFinancial ? 'financial' : newCustodyCategory,
      assignedDate: new Date().toISOString().split('T')[0],
      condition: newCustodyCondition,
      amount: isFinancial ? Number(newCustodyAmount) : undefined,
      financialPurpose: isFinancial ? newCustodyPurpose : undefined,
      expenseCategory: isFinancial ? newCustodyExpenseCat : undefined,
      estimatedSettlementDate: isFinancial ? newCustodyEstSettlementDate : undefined,
      settlementStatus: isFinancial ? 'none' : undefined,
      costCenterId: cc?.id,
      costCenterName: cc?.name,
      status: isFinancial ? 'pending' : 'assigned',
      approvalWorkflow: isFinancial ? [
        { stepIndex: 1, role: 'المشرف المباشر', roleId: '1', status: 'pending' },
        { stepIndex: 2, role: 'مدير الموارد البشرية (HR)', roleId: '5', status: 'pending' },
        { stepIndex: 3, role: 'المدير المالي (CFO)', roleId: '2', status: 'pending' }
      ] : undefined,
      notes: newCustodyNotes
    };

    if (onAddCustody) onAddCustody(newCustody);
    setShowAddCustodyModal(false);
    
    // Reset inputs
    setNewCustodyEmpId('');
    setNewCustodyAssetName('');
    setNewCustodySerial('');
    setNewCustodyNotes('');
    setNewCustodyPurpose('');
    setNewCustodyAmount(10000);
    
    if (isFinancial) {
      alert(`تم تقديم طلب العُهدة المالية رقم (${newCustody.requestNo}) للموظف ${emp.name} بنجاح وإدراجه في دورة الاعتماد المالي!`);
    } else {
      alert(`تم تخصيص وتسجيل العُهدة العينية "${newCustody.assetName}" للموظف ${emp.name} بنجاح!`);
    }
  };

  const handleReturnCustody = (custodyId: string) => {
    if (confirm('هل تم التأكد من استلام العُهدة وفحص حالتها الفنية؟')) {
      if (onUpdateCustody) {
        onUpdateCustody(custodyId, {
          status: 'returned',
          returnDate: new Date().toISOString().split('T')[0]
        });
      }
    }
  };

  // Helper: Determine if a custody is overdue (متأخرة عن تاريخ التسوية/الإرجاع)
  const isCustodyOverdue = (custody: EmployeeCustody) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Settled, returned, or rejected custodies are not overdue
    if (custody.status === 'settled' || custody.status === 'returned' || custody.status === 'rejected') {
      return false;
    }

    if (custody.custodyType === 'financial' || custody.category === 'financial') {
      if (custody.estimatedSettlementDate && custody.estimatedSettlementDate < todayStr && custody.settlementStatus !== 'settled') {
        return true;
      }
    } else {
      if (custody.status === 'assigned') {
        if (custody.estimatedSettlementDate && custody.estimatedSettlementDate < todayStr) {
          return true;
        }
        const assignedTime = new Date(custody.assignedDate).getTime();
        const nowTime = new Date().getTime();
        const diffDays = Math.floor((nowTime - assignedTime) / (1000 * 60 * 60 * 24));
        if (diffDays > 60 && !custody.returnDate) {
          return true;
        }
      }
    }

    return false;
  };

  // PDF Export Handler for Custody Consumption & Auditing Report
  const handleExportCustodyConsumptionPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // Filtered custodies based on report selections
      const filteredForReport = custodies.filter(c => {
        const isOverdue = isCustodyOverdue(c);
        const isOpen = c.status === 'assigned' || c.status === 'approved' || c.status === 'pending' || c.status === 'under_review';
        const isSettled = c.status === 'settled' || c.status === 'returned' || c.settlementStatus === 'settled';

        if (custodyReportStatusFilter === 'open' && !isOpen) return false;
        if (custodyReportStatusFilter === 'settled' && !isSettled) return false;
        if (custodyReportStatusFilter === 'overdue' && !isOverdue) return false;

        if (custodyReportCategoryFilter === 'financial' && c.custodyType !== 'financial') return false;
        if (custodyReportCategoryFilter === 'material' && c.custodyType === 'financial') return false;

        if (custodyReportDeptFilter !== 'all' && c.department !== custodyReportDeptFilter) return false;

        if (custodyReportSearch) {
          const q = custodyReportSearch.toLowerCase();
          const matchName = c.empName.toLowerCase().includes(q);
          const matchAsset = c.assetName.toLowerCase().includes(q);
          const matchReq = (c.requestNo || '').toLowerCase().includes(q);
          if (!matchName && !matchAsset && !matchReq) return false;
        }

        return true;
      });

      const reportRows = filteredForReport.map(c => {
        const isOverdue = isCustodyOverdue(c);
        const isFin = c.custodyType === 'financial';
        
        let delayDaysStr = 'منتظمة';
        if (c.estimatedSettlementDate && (c.status !== 'settled' && c.status !== 'returned')) {
          const estTime = new Date(c.estimatedSettlementDate).getTime();
          const nowTime = new Date().getTime();
          const diff = Math.floor((nowTime - estTime) / (1000 * 60 * 60 * 24));
          if (diff > 0) {
            delayDaysStr = `${diff} يوم تأخير`;
          }
        }

        let statusText = 'مفتوحة قائمة';
        if (c.status === 'settled' || c.settlementStatus === 'settled') statusText = 'مسواة دفترياً';
        else if (c.status === 'returned') statusText = 'مسترجعة للمخزن';
        else if (isOverdue) statusText = '⚠️ متأخرة عن التسوية';
        else if (c.status === 'pending' || c.status === 'under_review') statusText = 'قيد الاعتماد الإداري';

        return {
          requestNo: c.requestNo || c.id.substring(0, 8),
          empInfo: `${c.empName}\n(${c.department || 'التشغيل والصيانة'})`,
          itemDescription: `${isFin ? '💵 مالية' : '📦 عينية'}: ${c.assetName}`,
          valueOrSerial: isFin ? `${(c.amount || 0).toLocaleString('ar-EG')} ج.م` : (c.serialNumber || 'N/A'),
          assignedDate: c.assignedDate,
          dueDate: c.estimatedSettlementDate || 'غير محدد',
          statusAr: statusText,
          delayDays: delayDaysStr
        };
      });

      // KPI Summaries
      const openItems = custodies.filter(c => c.status === 'assigned' || c.status === 'approved' || c.status === 'pending' || c.status === 'under_review');
      const openTotalValue = openItems.filter(c => c.custodyType === 'financial').reduce((a, b) => a + (b.amount || 0), 0);

      const settledItems = custodies.filter(c => c.status === 'settled' || c.status === 'returned' || c.settlementStatus === 'settled');
      const settledTotalValue = settledItems.filter(c => c.custodyType === 'financial').reduce((a, b) => a + (b.settledAmount || b.amount || 0), 0);

      const overdueItems = custodies.filter(c => isCustodyOverdue(c));
      const overdueTotalValue = overdueItems.filter(c => c.custodyType === 'financial').reduce((a, b) => a + (b.amount || 0), 0);

      await exportTableToPDF({
        titleAr: 'تقرير استهلاك ورقابة العُهد المالية والعينية المعتمد',
        titleEn: 'Official Custody Consumption & Audit Report',
        subtitleAr: 'تقرير المراجعة والتدقيق الإداري الدوري - شركة الأوناش المصرية والأعمال اللوجستية',
        subtitleEn: 'Administrative Audit & Settlement Monitoring Log',
        filename: `EgyptCranes_Custody_Consumption_Audit_${todayStr}`,
        orientation: 'landscape',
        summaryItems: [
          { labelAr: 'العهد المفتوحة والقائمة', value: `${openItems.length} عُهدة (${openTotalValue.toLocaleString('ar-EG')} ج.م)` },
          { labelAr: 'العهد المستقرة والمسواة', value: `${settledItems.length} عُهدة (${settledTotalValue.toLocaleString('ar-EG')} ج.م)` },
          { labelAr: 'العهد المتأخرة عن التسوية', value: `${overdueItems.length} عُهدة متأخرة (${overdueTotalValue.toLocaleString('ar-EG')} ج.م)`, highlight: true },
          { labelAr: 'إجمالي العهد المسجلة', value: `${custodies.length} عُهدة` }
        ],
        columns: [
          { headerAr: 'رقم الطلب', accessor: 'requestNo', width: '90px' },
          { headerAr: 'الموظف والقسم', accessor: 'empInfo', width: '150px' },
          { headerAr: 'نوع العُهدة والبيان', accessor: 'itemDescription', width: '200px' },
          { headerAr: 'القيمة / S/N', accessor: 'valueOrSerial', align: 'center', width: '120px' },
          { headerAr: 'تاريخ التسليم', accessor: 'assignedDate', align: 'center', width: '100px' },
          { headerAr: 'مهلة التسوية', accessor: 'dueDate', align: 'center', width: '100px' },
          { headerAr: 'حالة الاستهلاك', accessor: 'statusAr', align: 'center', width: '120px' },
          { headerAr: 'موقف التأخير', accessor: 'delayDays', align: 'center', width: '90px' }
        ],
        data: reportRows
      });
    } catch (err) {
      console.error('PDF Export Error:', err);
      alert('حدث خطأ أثناء تصدير التقرير، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 7. Task Assignment Handlers
  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === newTaskEmpId);
    if (!emp) {
      alert('يرجى اختيار الموظف المكلف بالمهمة');
      return;
    }

    const taskNo = `TSK-2026-${String(tasks.length + 1).padStart(3, '0')}`;
    const newTask: TaskAssignment = {
      id: 'task-' + Math.random().toString(36).substring(2, 9),
      taskNo,
      title: newTaskTitle,
      description: newTaskDesc,
      assignedToEmpId: emp.id,
      assignedToEmpName: emp.name,
      assignedBy: currentUser.fullName || 'مدير التشغيل',
      relatedType: newTaskRelatedType,
      relatedEntityName: newTaskRelatedEntity || undefined,
      dueDate: newTaskDueDate,
      priority: newTaskPriority,
      status: 'pending'
    };

    if (onAddTask) onAddTask(newTask);
    setShowAddTaskModal(false);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskEmpId('');
    setNewTaskRelatedEntity('');
    alert(`تم إسناد المهمة رقم ${taskNo} للموظف ${emp.name} وإرسال التنبيه!`);
  };

  const handleCompleteTask = (taskId: string) => {
    const notes = prompt('يرجى كتابة الملاحظات الختامية حول إنجاز المهمة:');
    if (onUpdateTask) {
      onUpdateTask(taskId, {
        status: 'completed',
        completionNotes: notes || 'تم الإنجاز والمراجعة بنجاح',
        completedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      });
    }
  };

  const handleDisburseIndividual = (id: string) => {
    if (!isHRAdmin) {
      alert('ليس لديك صلاحية الموافقة والصرف المالي');
      return;
    }
    onUpdatePayroll(id, { status: 'paid' });
  };

  const handleDisburseAllDrafts = () => {
    if (!isHRAdmin) {
      alert('ليس لديك صلاحية الصرف المالي الموحد');
      return;
    }
    const draftPayrolls = payrolls.filter(p => p.status === 'draft');
    if (draftPayrolls.length === 0) {
      alert('لا توجد رواتب غير معتمدة للصرف في هذا المسير');
      return;
    }
    draftPayrolls.forEach(p => {
      onUpdatePayroll(p.id, { status: 'paid' });
    });
    alert(`تم اعتماد وتحويل الرواتب لـ ${draftPayrolls.length} موظف إلى نظام الدفع البنكي الموحد`);
  };

  // Filters computed lists
  const filteredEmployeesList = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(empSearch.toLowerCase()) || 
                            emp.role.toLowerCase().includes(empSearch.toLowerCase()) || 
                            emp.nationalId.includes(empSearch);
      const matchesDept = empDeptFilter === 'all' ? true : emp.department === empDeptFilter;
      const matchesStatus = empStatusFilter === 'all' ? true : emp.status === empStatusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, empSearch, empDeptFilter, empStatusFilter]);

  const filteredAttendanceList = useMemo(() => {
    return attendance.filter(att => {
      const matchesSearch = att.empName.toLowerCase().includes(attSearch.toLowerCase());
      const matchesStatus = attStatusFilter === 'all' ? true : att.status === attStatusFilter;
      const matchesDate = attDateFilter ? att.date === attDateFilter : true;
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [attendance, attSearch, attStatusFilter, attDateFilter]);

  const filteredLeavesList = useMemo(() => {
    return leaveRequests.filter(leave => {
      const matchesSearch = leave.empName.toLowerCase().includes(leaveSearch.toLowerCase()) || 
                            (leave.reason && leave.reason.toLowerCase().includes(leaveSearch.toLowerCase()));
      const matchesType = leaveTypeFilter === 'all' ? true : leave.type === leaveTypeFilter;
      const matchesStatus = leaveStatusFilter === 'all' ? true : leave.status === leaveStatusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [leaveRequests, leaveSearch, leaveTypeFilter, leaveStatusFilter]);

  const filteredPayrollsList = useMemo(() => {
    return payrolls.filter(pay => {
      const matchesSearch = pay.empName.toLowerCase().includes(paySearch.toLowerCase());
      const matchesMonth = payMonthFilter === 'all' ? true : pay.month === payMonthFilter;
      const matchesStatus = payStatusFilter === 'all' ? true : pay.status === payStatusFilter;
      return matchesSearch && matchesMonth && matchesStatus;
    });
  }, [payrolls, paySearch, payMonthFilter, payStatusFilter]);

  // General Statistics
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.status === 'active').length;
    const vacation = employees.filter(e => e.status === 'vacation').length;
    const suspended = employees.filter(e => e.status === 'suspended').length;
    
    // Attendance stats for today
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = attendance.filter(a => a.date === todayStr);
    const presentCount = todayLogs.filter(l => l.status === 'present').length;
    const lateCount = todayLogs.filter(l => l.status === 'late').length;
    
    // Total Payroll
    const currentMonthStr = '2026-07';
    const currentMonthPay = payrolls.filter(p => p.month === currentMonthStr);
    const totalPayrollPaid = currentMonthPay.filter(p => p.status === 'paid').reduce((a,b) => a + b.netSalary, 0);
    const totalPayrollDraft = currentMonthPay.filter(p => p.status === 'draft').reduce((a,b) => a + b.netSalary, 0);

    return {
      total,
      active,
      vacation,
      suspended,
      presentCount,
      lateCount,
      totalPayrollPaid,
      totalPayrollDraft
    };
  }, [employees, attendance, payrolls]);

  // Get Arabic label for leave types
  const getLeaveTypeAr = (type: string) => {
    switch (type) {
      case 'annual': return 'سنوية اعتيادية';
      case 'sick': return 'مرضية معتمدة';
      case 'unpaid': return 'دون مرتب';
      case 'emergency': return 'إجازة عارضة';
      default: return type;
    }
  };

  return (
    <div className="p-6 space-y-6 dir-rtl text-right font-sans min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/20 to-amber-50/15 relative overflow-hidden">
      {/* Decorative glass glow blobs to make backdrop blur look stunning */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-400/10 blur-3xl pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-1/3 left-1/4 w-96 h-96 rounded-full bg-[#F7941D]/5 blur-3xl pointer-events-none animate-pulse duration-[6000ms]" />

      {/* Export loading / Success Glass Overlay Notification */}
      <AnimatePresence>
        {exportNotification && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-lg"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="bg-white/80 backdrop-blur-2xl border border-white/50 p-7 rounded-3xl shadow-[0_24px_50px_-12px_rgba(15,76,129,0.15)] max-w-md w-full text-center space-y-4"
            >
              <div className="mx-auto w-16 h-16 bg-blue-50/80 text-[#0F4C81] rounded-2xl flex items-center justify-center shadow-inner animate-bounce">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">تصدير الموارد البشرية المعتمد</h3>
                <p className="text-xs text-slate-500 mt-1 font-mono bg-slate-100/50 py-1 px-3 rounded-lg inline-block">{exportNotification.filename}</p>
              </div>
              <div className="py-2 space-y-3">
                <p className="text-xs font-bold text-[#0F4C81]">{exportNotification.message}</p>
                <div className="w-full bg-slate-200/50 h-2 rounded-full overflow-hidden p-0.5 border border-white/50">
                  <div className="bg-[#0F4C81] h-full rounded-full animate-infinite-loading w-3/4" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Container */}
      <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 border-b border-slate-200/55 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#0F4C81]">
            <Sparkles className="w-5 h-5 text-[#F7941D]" />
            <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 px-2 py-1 rounded-md border border-blue-100/60">بوابة رأس المال البشري الموحد ER-Portal</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 mt-1.5">الإدارة الشاملة للموارد البشرية والكوادر الميدانية</h1>
          <p className="text-xs text-slate-400 mt-1.5 font-bold">ملفات الهوية والموظفين، الحضور البيومتري، اعتمادات الإجازات والرواتب المصرفية لشركة إيجيبت كرينز</p>
        </div>

        {/* Security / HR Role context */}
        <div className="bg-white/40 backdrop-blur-md border border-white/80 p-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center gap-3">
          <Fingerprint className="w-9 h-9 text-[#0F4C81] bg-white/80 rounded-xl p-2 border border-slate-100" />
          <div>
            <span className="text-[9px] text-slate-400 font-bold block">المستخدم المصرح له حالياً:</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-black text-slate-800">{currentUser.fullName}</span>
              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black ${
                isHRAdmin ? 'bg-amber-100/80 text-amber-900 border border-amber-200/50' : 'bg-slate-100/80 text-slate-600'
              }`}>{currentUser.roleName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* High-Fidelity Stats Grid (Glassmorphic Accent Cards) */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Workforce */}
        <div className="bg-white/50 backdrop-blur-md border border-white/70 hover:bg-white/60 hover:scale-[1.01] transition-all rounded-2xl p-5 flex items-center justify-between shadow-[0_8px_32px_0_rgba(15,76,129,0.03)]">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold block">إجمالي أسطول القوى البشرية</span>
            <p className="text-2xl font-black text-slate-800">{stats.total} موظف</p>
            <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50/80 border border-emerald-100/50 px-2 py-0.5 rounded-full inline-block">
              {stats.active} نشط على رأس العمل
            </span>
          </div>
          <div className="p-3.5 bg-blue-50/80 text-[#0F4C81] rounded-2xl border border-blue-100/60 shadow-sm">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Attendance Today */}
        <div className="bg-white/50 backdrop-blur-md border border-white/70 hover:bg-white/60 hover:scale-[1.01] transition-all rounded-2xl p-5 flex items-center justify-between shadow-[0_8px_32px_0_rgba(15,76,129,0.03)]">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold block">بصمة حضور اليوم</span>
            <p className="text-2xl font-black text-emerald-600">{stats.presentCount + stats.lateCount} موظف</p>
            <span className="text-[9px] text-amber-600 font-extrabold bg-amber-50/80 border border-amber-100/50 px-2 py-0.5 rounded-full inline-block">
              {stats.lateCount} تأخيرات تم رصدها
            </span>
          </div>
          <div className="p-3.5 bg-emerald-50/80 text-emerald-600 rounded-2xl border border-emerald-100/60 shadow-sm">
            <Fingerprint className="w-5 h-5" />
          </div>
        </div>

        {/* Leave Requests Pending */}
        <div className="bg-white/50 backdrop-blur-md border border-white/70 hover:bg-white/60 hover:scale-[1.01] transition-all rounded-2xl p-5 flex items-center justify-between shadow-[0_8px_32px_0_rgba(15,76,129,0.03)]">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold block">طلبات إجازات معلقة</span>
            <p className="text-2xl font-black text-amber-600">
              {leaveRequests.filter(l => l.status === 'pending').length} طلبات
            </p>
            <span className="text-[9px] text-slate-500 font-extrabold bg-slate-50/80 border border-slate-100 px-2 py-0.5 rounded-full inline-block">
              {stats.vacation} في إجازة حالياً
            </span>
          </div>
          <div className="p-3.5 bg-amber-50/80 text-amber-600 rounded-2xl border border-amber-100/60 relative shadow-sm">
            {leaveRequests.filter(l => l.status === 'pending').length > 0 && (
              <span className="absolute top-2.5 left-2.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Financial Disbursed */}
        <div className="bg-white/50 backdrop-blur-md border border-white/70 hover:bg-white/60 hover:scale-[1.01] transition-all rounded-2xl p-5 flex items-center justify-between shadow-[0_8px_32px_0_rgba(15,76,129,0.03)]">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold block">مسير رواتب يوليو 2026</span>
            <p className="text-xl font-black text-slate-800">{(stats.totalPayrollPaid + stats.totalPayrollDraft).toLocaleString('ar-EG')} ج.م</p>
            <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50/80 border border-emerald-100/50 px-2 py-0.5 rounded-full inline-block">
              تم صرف: {stats.totalPayrollPaid.toLocaleString('ar-EG')} ج.م
            </span>
          </div>
          <div className="p-3.5 bg-[#F7941D]/10 text-[#0f4c81] rounded-2xl border border-[#F7941D]/20 shadow-sm">
            <Coins className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Tabs Layout Styled as a Premium Capsule Navigation */}
      <div className="relative z-10 bg-slate-200/45 backdrop-blur-lg border border-slate-200/50 p-1 rounded-2xl flex flex-wrap gap-1 w-full overflow-x-auto">
        {[
          { id: 'employees', label: 'دليل الموظفين', icon: Users },
          { id: 'attendance', label: 'تسجيل الحضور', icon: Fingerprint },
          { id: 'leaves', label: 'طلبات الإجازات', icon: CalendarCheck },
          { id: 'payroll', label: 'مسيرات الرواتب', icon: Coins },
          { id: 'loans', label: 'السلف المالية (Loans)', icon: HandCoins },
          { id: 'custodies', label: 'إدارة العُهد (Custody)', icon: Laptop },
          { id: 'tasks', label: 'إسناد المهام (Tasks)', icon: CheckSquare }
        ].map(tab => {
          const TabIcon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black transition-all rounded-xl cursor-pointer whitespace-nowrap ${
                isSelected 
                  ? 'bg-white text-[#0F4C81] shadow-xs scale-[1.02] border border-white/70' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/30'
              }`}
            >
              <TabIcon className={`w-4 h-4 ${isSelected ? 'text-[#0F4C81]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Actionable View Container with Glassmorphism Cards */}
      <div className="relative z-10 space-y-6">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: EMPLOYEE DIRECTORY */}
          {activeTab === 'employees' && (
            <motion.div
              key="employees-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              
              {/* Filter, Search & Add Employee Ribbon */}
              <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(15,76,129,0.02)] p-5 rounded-2xl flex flex-col lg:flex-row justify-between items-center gap-4">
                
                {/* Real-time Searching & Filters */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  
                  <div className="relative flex-1 sm:flex-initial sm:w-72">
                    <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="البحث بالاسم، الوظيفة أو الهوية..."
                      value={empSearch}
                      onChange={e => setEmpSearch(e.target.value)}
                      className="w-full pr-10 pl-4 py-2.5 border border-slate-200/60 bg-white/50 backdrop-blur-xs rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Department Filter */}
                  <div className="flex items-center gap-1.5 border border-slate-200/60 bg-white/50 backdrop-blur-xs px-3 py-2.5 rounded-xl">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                      value={empDeptFilter}
                      onChange={e => setEmpDeptFilter(e.target.value)}
                      className="bg-transparent text-xs font-black text-slate-600 focus:outline-none border-none p-0 pr-1 cursor-pointer"
                    >
                      <option value="all">كل الأقسام الإدارية</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1.5 border border-slate-200/60 bg-white/50 backdrop-blur-xs px-3 py-2.5 rounded-xl">
                    <Activity className="w-4 h-4 text-slate-400" />
                    <select
                      value={empStatusFilter}
                      onChange={e => setEmpStatusFilter(e.target.value)}
                      className="bg-transparent text-xs font-black text-slate-600 focus:outline-none border-none p-0 pr-1 cursor-pointer"
                    >
                      <option value="all">كل الحالات الوظيفية</option>
                      <option value="active">نشط بالخدمة</option>
                      <option value="vacation">في إجازة</option>
                      <option value="suspended">موقوف أمنياً</option>
                    </select>
                  </div>

                </div>

                {/* Directory Management Actions */}
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
                  <button 
                    onClick={() => handleExportData(
                      filteredEmployeesList, 
                      ['رقم الموظف', 'الاسم الكامل', 'الوظيفة والمسمى', 'القسم', 'الهاتف', 'البريد الإلكتروني', 'الراتب الأساسي', 'تاريخ التعيين', 'الحالة'],
                      ['id', 'name', 'role', 'department', 'phone', 'email', 'salary', 'hireDate', 'status'],
                      'EgyptCranes_Workforce_Report'
                    )}
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200/80 bg-white/60 backdrop-blur-xs hover:bg-white transition-all rounded-xl text-xs font-bold text-slate-600 shadow-sm cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>تصدير دليل الموظفين (Excel)</span>
                  </button>

                  <button 
                    onClick={() => {
                      if (!isHRAdmin) {
                        alert('عذراً، يتطلب هذا الإجراء صلاحيات مدير الموارد البشرية');
                        return;
                      }
                      setShowAddEmpModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F4C81] hover:bg-[#0f4c81]/90 text-white transition-all rounded-xl text-xs font-black shadow-md hover:shadow-lg hover:scale-[1.01] cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>تسجيل ملف موظف جديد</span>
                  </button>
                </div>

              </div>

              {/* Grid Cards (Glassmorphism look with hover effects) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredEmployeesList.length === 0 ? (
                  <div className="col-span-full py-16 text-center bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-8 space-y-4 shadow-sm">
                    <Users className="w-14 h-14 text-slate-300 mx-auto" />
                    <div>
                      <p className="text-sm font-extrabold text-slate-600">لا توجد نتائج مطابقة لبحثك في دليل الموظفين</p>
                      <p className="text-xs text-slate-400 mt-1">يرجى تعديل فلاتر التصفية أو إدخال مسمى وظيفي آخر.</p>
                    </div>
                  </div>
                ) : (
                  filteredEmployeesList.map(emp => {
                    const initials = emp.name.split(' ').slice(0, 2).map(n => n[0]).join(' • ');
                    return (
                      <div 
                        key={emp.id} 
                        id={`emp-${emp.id}`}
                        className="bg-white/50 backdrop-blur-md border border-white/70 hover:border-blue-300/80 rounded-2xl p-5 shadow-[0_8px_32px_0_rgba(15,76,129,0.02)] hover:shadow-[0_12px_40px_rgba(15,76,129,0.08)] hover:bg-white/75 hover:scale-[1.01] transition-all duration-300 space-y-4 relative overflow-hidden group"
                      >
                        {/* Status Accent Stripe */}
                        <div className={`absolute top-0 right-0 left-0 h-1.5 transition-all ${
                          emp.status === 'active' ? 'bg-emerald-500' :
                          emp.status === 'vacation' ? 'bg-amber-400' : 'bg-rose-500'
                        }`} />

                        {/* Top Profile Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#0F4C81]/10 text-[#0F4C81] group-hover:bg-[#0F4C81] group-hover:text-white transition-all rounded-xl flex items-center justify-center font-black text-xs border border-blue-100/60 shadow-inner">
                              {initials}
                            </div>
                            <div>
                              <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">{emp.name}</h3>
                              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                                <Briefcase className="w-3 h-3 text-slate-300" />
                                {emp.department}
                              </span>
                            </div>
                          </div>

                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black shadow-3xs ${
                            emp.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            emp.status === 'vacation' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {emp.status === 'active' ? 'نشط بالخدمة' :
                             emp.status === 'vacation' ? 'إجازة رسمية' : 'موقوف أمنياً'}
                          </span>
                        </div>

                        {/* Body Details list */}
                        <div className="pt-3 border-t border-slate-100 space-y-2 text-xs font-semibold text-slate-600">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">المسمى الوظيفي:</span>
                            <span className="text-slate-800 font-bold">{emp.role}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">الرقم القومي / الهوية:</span>
                            <span className="text-slate-800 font-mono font-bold tracking-wider">{emp.nationalId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">الراتب التعاقدي:</span>
                            <span className="text-[#0F4C81] font-black">{emp.salary.toLocaleString('ar-EG')} ج.م</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">تاريخ التعيين:</span>
                            <span className="text-slate-500 font-mono font-bold">{emp.hireDate}</span>
                          </div>
                        </div>

                        {/* Quick Interactive Actions */}
                        <div className="pt-3.5 border-t border-slate-100/60 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <a 
                              href={`tel:${emp.phone}`}
                              className="p-2.5 bg-slate-50 hover:bg-blue-50 hover:text-[#0F4C81] text-slate-500 rounded-xl transition-all border border-slate-100 shadow-3xs"
                              title={emp.phone}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <a 
                              href={`mailto:${emp.email}`}
                              className="p-2.5 bg-slate-50 hover:bg-blue-50 hover:text-[#0F4C81] text-slate-500 rounded-xl transition-all border border-slate-100 shadow-3xs"
                              title={emp.email}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Check-In Simulator */}
                            {emp.status === 'active' && (
                              <button
                                onClick={() => handleInstantAttendance(emp.name)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-100/80 text-[10px] font-black rounded-lg transition-all cursor-pointer shadow-3xs"
                              >
                                <Fingerprint className="w-3 h-3 text-emerald-600" />
                                <span>بصمة حضور</span>
                              </button>
                            )}

                            {/* Security Block Switch */}
                            {isHRAdmin && emp.status !== 'vacation' && (
                              <button
                                onClick={() => handleToggleStatus(emp.id, emp.status)}
                                className={`px-2.5 py-1.5 text-[10px] font-black rounded-lg transition-all border cursor-pointer shadow-3xs ${
                                  emp.status === 'active' 
                                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-100'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100'
                                }`}
                              >
                                {emp.status === 'active' ? 'تعليق أمني' : 'تنشيط الخدمة'}
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </motion.div>
          )}

          {/* TAB 2: ATTENDANCE LOGS */}
          {activeTab === 'attendance' && (
            <motion.div
              key="attendance-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              
              {/* Context Notice on Biometric Attendance */}
              <div className="bg-[#0F4C81]/10 backdrop-blur-md border border-[#0F4C81]/20 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Fingerprint className="w-10 h-10 text-[#0F4C81] bg-white/70 rounded-xl p-2 border border-[#0F4C81]/20 shadow-xs" />
                  <div>
                    <h4 className="text-xs font-black text-slate-800">بوابة الحضور والانصراف البيومترية الميدانية</h4>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">تعتمد البوابة الأمنية على بصمة الكادر اليومية لمنح سائقي الأوناش تصاريح التشغيل المعتمدة تلقائياً</p>
                  </div>
                </div>

                <div className="text-left font-bold text-xs text-[#0F4C81] bg-white/60 px-3 py-1.5 rounded-xl border border-white/70 shadow-3xs">
                  <span>آخر رصد تلقائي للنظام: اليوم، </span>
                  <span className="font-mono text-slate-800 font-extrabold">08:30 ص</span>
                </div>
              </div>

              {/* Filters & Export controls */}
              <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(15,76,129,0.02)] p-5 rounded-2xl flex flex-col lg:flex-row justify-between items-center gap-4">
                
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <div className="relative flex-1 sm:flex-initial sm:w-72">
                    <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="البحث باسم الموظف الميداني..."
                      value={attSearch}
                      onChange={e => setAttSearch(e.target.value)}
                      className="w-full pr-10 pl-4 py-2.5 border border-slate-200/60 bg-white/50 backdrop-blur-xs rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1.5 border border-slate-200/60 bg-white/50 backdrop-blur-xs px-3 py-2.5 rounded-xl">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                      value={attStatusFilter}
                      onChange={e => setAttStatusFilter(e.target.value)}
                      className="bg-transparent text-xs font-black text-slate-600 focus:outline-none border-none p-0 pr-1 cursor-pointer"
                    >
                      <option value="all">كل الحالات اليومية</option>
                      <option value="present">حاضر بالموعد</option>
                      <option value="late">متأخر عن الخدمة</option>
                      <option value="leave">في إجازة معتمدة</option>
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div className="flex items-center gap-2 border border-slate-200/60 bg-white/50 backdrop-blur-xs px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <input 
                      type="date"
                      value={attDateFilter}
                      onChange={e => setAttDateFilter(e.target.value)}
                      className="focus:outline-none bg-transparent cursor-pointer font-black"
                    />
                  </div>
                </div>

                <div className="w-full lg:w-auto flex justify-end">
                  <button 
                    onClick={() => handleExportData(
                      filteredAttendanceList,
                      ['اسم الموظف', 'التاريخ', 'وقت الحضور', 'وقت الانصراف', 'الحالة'],
                      ['empName', 'date', 'checkIn', 'checkOut', 'status'],
                      'EgyptCranes_Attendance_Logs'
                    )}
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200/80 bg-white/60 backdrop-blur-xs hover:bg-white transition-all rounded-xl text-xs font-bold text-slate-600 shadow-sm cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>تصدير تقرير الحضور اليومي</span>
                  </button>
                </div>

              </div>

              {/* Table list with Glassmorphic design */}
              <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(15,76,129,0.02)] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-100/50 text-slate-500 text-xs font-black border-b border-slate-200/40">
                        <th className="px-6 py-4">اسم الموظف والكادر الميداني</th>
                        <th className="px-6 py-4 text-center">التاريخ الحالي</th>
                        <th className="px-6 py-4 text-center">بصمة الحضور</th>
                        <th className="px-6 py-4 text-center">بصمة الانصراف</th>
                        <th className="px-6 py-4 text-center">الحالة اليومية</th>
                        <th className="px-6 py-4 text-center">الإجراء الفوري</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/30 text-xs font-bold">
                      {filteredAttendanceList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-16 text-center text-slate-400 font-extrabold bg-white/20">
                            لا توجد بيانات بصمة مطابقة للتصفية الحالية في السجلات
                          </td>
                        </tr>
                      ) : (
                        filteredAttendanceList.map(log => (
                          <tr key={log.id} className="hover:bg-white/40 transition-colors duration-150">
                            <td className="px-6 py-4">
                              <span className="text-slate-800 block text-xs font-black">{log.empName}</span>
                              <span className="text-[9px] text-slate-400 font-bold block mt-0.5">رصد بيومتري ذكي</span>
                            </td>
                            <td className="px-6 py-4 text-center text-slate-500 font-mono font-bold">{log.date}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/70 border border-slate-100 rounded-lg text-slate-700 font-mono shadow-3xs">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {log.checkIn}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {log.checkOut ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50/80 text-emerald-800 border border-emerald-100/40 rounded-lg font-mono shadow-3xs">
                                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                                  {log.checkOut}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-bold text-[10px] bg-slate-100/50 py-1 px-2.5 rounded-lg">--:-- (على رأس العمل)</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black shadow-3xs ${
                                log.status === 'present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' :
                                log.status === 'late' ? 'bg-amber-50 text-amber-700 border border-amber-100/50' :
                                log.status === 'leave' ? 'bg-blue-50 text-blue-700 border border-blue-100/50' :
                                'bg-rose-50 text-rose-700 border border-rose-100/50'
                              }`}>
                                {log.status === 'present' ? 'حاضر بالموعد' :
                                 log.status === 'late' ? 'متأخر عن الدوام' :
                                 log.status === 'leave' ? 'إجازة رسمية' : 'غياب'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {!log.checkOut && log.status !== 'leave' ? (
                                <button
                                  onClick={() => handleInstantCheckOut(log.id)}
                                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-black rounded-lg transition-all cursor-pointer shadow-sm hover:shadow-md"
                                >
                                  تسجيل الانصراف
                                </button>
                              ) : (
                                <span className="text-slate-400 text-[10px] font-bold bg-slate-100/40 py-1 px-2.5 rounded-lg border border-slate-200/10">مسجل ومقفل</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 3: LEAVE REQUESTS */}
          {activeTab === 'leaves' && (
            <motion.div
              key="leaves-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              
              {/* Safety notice link to gate operations */}
              <div className="bg-slate-900/85 backdrop-blur-md text-white p-5 rounded-2xl border border-white/15 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-10 h-10 text-amber-400 bg-white/10 rounded-xl p-2 border border-white/10" />
                  <div>
                    <h4 className="text-xs font-black text-amber-300">نظام حوكمة الأمان والربط التلقائي للبوابة الأمنية</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed mt-1 font-semibold">
                      الموافقة على إجازة سائق أو مشغل معدات هيدروليكية تحول حالته فورياً إلى "في إجازة". هذا يقوم تلقائياً بـ <span className="text-rose-400 font-black">تعليق تصاريح البوابة وأمن الـ QR</span> الخاصة به، لمنع أي تجاوزات لأسطول مصر للأوناش.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowAddLeaveModal(true)}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md hover:scale-[1.01] cursor-pointer shrink-0"
                >
                  تقديم طلب إجازة رسمي جديد
                </button>
              </div>

              {/* Leave Statistics Mini Grid (Glassmorphism) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/40 backdrop-blur-md border border-white/60 p-4 rounded-2xl shadow-3xs hover:scale-[1.01] transition-all flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">إجمالي طلبات الإجازات</span>
                    <span className="text-xl font-black text-slate-800 font-mono mt-1 block">{leaveRequests.length}</span>
                  </div>
                  <div className="p-2.5 bg-slate-100/60 rounded-xl text-slate-500 border border-slate-200/20">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>

                <div className="bg-white/40 backdrop-blur-md border border-white/60 p-4 rounded-2xl shadow-3xs hover:scale-[1.01] transition-all flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-amber-500 font-bold block">بانتظار المراجعة والاعتماد</span>
                    <span className="text-xl font-black text-amber-700 font-mono mt-1 block font-bold">
                      {leaveRequests.filter(r => r.status === 'pending').length}
                    </span>
                  </div>
                  <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl border border-amber-100">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>

                <div className="bg-white/40 backdrop-blur-md border border-white/60 p-4 rounded-2xl shadow-3xs hover:scale-[1.01] transition-all flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-600 font-bold block">طلبات معتمدة ومقيدة</span>
                    <span className="text-xl font-black text-emerald-700 font-mono mt-1 block font-bold">
                      {leaveRequests.filter(r => r.status === 'approved').length}
                    </span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>

                <div className="bg-white/40 backdrop-blur-md border border-white/60 p-4 rounded-2xl shadow-3xs hover:scale-[1.01] transition-all flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-rose-600 font-bold block">طلبات مرفوضة إدارياً</span>
                    <span className="text-xl font-black text-rose-700 font-mono mt-1 block font-bold">
                      {leaveRequests.filter(r => r.status === 'rejected').length}
                    </span>
                  </div>
                  <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl border border-rose-100">
                    <XCircle className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Searching, Filters and Export Header */}
              <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(15,76,129,0.02)] p-5 rounded-2xl flex flex-col lg:flex-row justify-between items-center gap-4">
                
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <div className="relative flex-1 sm:flex-initial sm:w-72">
                    <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="البحث باسم الموظف أو مبرر الإجازة..."
                      value={leaveSearch}
                      onChange={e => setLeaveSearch(e.target.value)}
                      className="w-full pr-10 pl-4 py-2.5 border border-slate-200/60 bg-white/50 backdrop-blur-xs rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Leave Type filter */}
                  <div className="flex items-center gap-1.5 border border-slate-200/60 bg-white/50 backdrop-blur-xs px-3 py-2.5 rounded-xl">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                      value={leaveTypeFilter}
                      onChange={e => setLeaveTypeFilter(e.target.value)}
                      className="bg-transparent text-xs font-black text-slate-600 focus:outline-none border-none p-0 pr-1 cursor-pointer"
                    >
                      <option value="all">كل أنواع الإجازات</option>
                      <option value="annual">سنوية اعتيادية</option>
                      <option value="sick">مرضية معتمدة</option>
                      <option value="unpaid">بدون مرتب</option>
                      <option value="emergency">إجازة عارضة</option>
                    </select>
                  </div>

                  {/* Leave Status filter */}
                  <div className="flex items-center gap-1.5 border border-slate-200/60 bg-white/50 backdrop-blur-xs px-3 py-2.5 rounded-xl">
                    <Activity className="w-4 h-4 text-slate-400" />
                    <select
                      value={leaveStatusFilter}
                      onChange={e => setLeaveStatusFilter(e.target.value)}
                      className="bg-transparent text-xs font-black text-slate-600 focus:outline-none border-none p-0 pr-1 cursor-pointer"
                    >
                      <option value="all">كل الحالات الإدارية</option>
                      <option value="pending">بانتظار المراجعة والاعتماد</option>
                      <option value="approved">معتمدة من الموارد البشرية</option>
                      <option value="rejected">مرفوضة إدارياً</option>
                    </select>
                  </div>
                </div>

                <div className="w-full lg:w-auto flex justify-end">
                  <button 
                    onClick={() => handleExportData(
                      filteredLeavesList,
                      ['اسم الموظف', 'نوع الإجازة', 'تاريخ البدء', 'تاريخ الانتهاء', 'إجمالي الأيام', 'السبب والتبرير', 'الحالة والموافقة'],
                      ['empName', 'type', 'startDate', 'endDate', 'days', 'reason', 'status'],
                      'EgyptCranes_Leave_Requests_Log'
                    )}
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200/80 bg-white/60 backdrop-blur-xs hover:bg-white transition-all rounded-xl text-xs font-bold text-slate-600 shadow-sm cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>تصدير سجل الإجازات (Excel)</span>
                  </button>
                </div>

              </div>

              {/* Grid Layout: Left is Interactive Table (2/3), Right is Self-service Leave Application Form (1/3) */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fadeIn">
                
                {/* 1. Interactive Leaves Data Table (Glassmorphism) */}
                <div className="xl:col-span-2 space-y-4">
                  <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(15,76,129,0.02)] rounded-3xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/40 bg-slate-100/30 flex justify-between items-center">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-800">جدول رصد ومتابعة الإجازات التفاعلي</h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">مزامنة حية مع تصاريح البوابات البيومترية والميدانية</p>
                      </div>
                      <span className="text-[9px] bg-white/70 border border-slate-200/40 text-[#0F4C81] px-3 py-1 rounded-full font-black shadow-3xs">
                        عدد الطلبات المصفاة: {filteredLeavesList.length}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-slate-100/50 text-slate-500 text-[10px] font-black border-b border-slate-200/40">
                            <th className="px-5 py-4">الموظف الكابتن</th>
                            <th className="px-3 py-4 text-center">نوع الإجازة</th>
                            <th className="px-3 py-4 text-center">الفترة الزمنية</th>
                            <th className="px-3 py-4 text-center">المدة</th>
                            <th className="px-3 py-4 text-center">المرتب</th>
                            <th className="px-4 py-4">السبب وتبرير الطلب</th>
                            <th className="px-3 py-4 text-center">الحالة الإدارية</th>
                            <th className="px-5 py-4 text-center">إجراءات سريعة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/30 text-xs font-semibold">
                          {filteredLeavesList.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-20 text-center text-slate-400 font-black bg-white/10">
                                <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                <span>لا توجد طلبات إجازة مطابقة لتصنيفات البحث الحالية في السجلات</span>
                              </td>
                            </tr>
                          ) : (
                            filteredLeavesList.map(leave => {
                              const emp = employees.find(e => e.name === leave.empName);
                              return (
                                <tr key={leave.id} className="hover:bg-white/40 transition-colors duration-150">
                                  {/* Employee Info Column */}
                                  <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-xl bg-[#0F4C81]/10 text-[#0F4C81] border border-blue-100/50 flex items-center justify-center font-black text-xs shadow-inner">
                                        {leave.empName[0]}
                                      </div>
                                      <div>
                                        <p className="font-black text-slate-800 text-xs">{leave.empName}</p>
                                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">{emp ? emp.role : 'كادر تشغيلي ميداني'}</p>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Type of Leave Column */}
                                  <td className="px-3 py-4 text-center">
                                    <span className="inline-block px-2.5 py-1 text-[9px] bg-blue-50/70 text-[#0F4C81] border border-blue-100/40 rounded-lg font-black">
                                      {getLeaveTypeAr(leave.type)}
                                    </span>
                                  </td>

                                  {/* Interval Column */}
                                  <td className="px-3 py-4 text-center">
                                    <div className="inline-flex flex-col items-center gap-0.5 text-[10px] text-slate-600 font-mono font-bold bg-white/40 border border-slate-100/60 px-2 py-1 rounded-lg shadow-3xs">
                                      <span>من: {leave.startDate}</span>
                                      <span className="text-slate-400 text-[9px]">إلى: {leave.endDate}</span>
                                    </div>
                                  </td>

                                  {/* Duration Days Column */}
                                  <td className="px-3 py-4 text-center font-black text-slate-700 font-mono">
                                    {leave.days} أيام
                                  </td>

                                  {/* Salary Status Column */}
                                  <td className="px-3 py-4 text-center">
                                    <span className={`text-[10px] font-black ${leave.type === 'unpaid' ? 'text-rose-600 bg-rose-50/40 px-2 py-0.5 rounded-md border border-rose-100/20' : 'text-emerald-700 bg-emerald-50/40 px-2 py-0.5 rounded-md border border-emerald-100/20'}`}>
                                      {leave.type === 'unpaid' ? 'خصم راتب' : 'مدفوعة الأجر'}
                                    </span>
                                  </td>

                                  {/* Reason Column */}
                                  <td className="px-4 py-4 text-slate-600 max-w-[160px] truncate font-bold text-[11px]" title={leave.reason}>
                                    {leave.reason}
                                  </td>

                                  {/* Status badge Column */}
                                  <td className="px-3 py-4 text-center">
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-black shadow-3xs border ${
                                      leave.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50' :
                                      leave.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100/50' :
                                      'bg-amber-50 text-amber-700 border-amber-100/50 animate-pulse'
                                    }`}>
                                      {leave.status === 'approved' ? 'معتمدة ومزمنة' :
                                       leave.status === 'rejected' ? 'مرفوضة إدارياً' : 'قيد المراجعة'}
                                    </span>
                                  </td>

                                  {/* Action Buttons Column */}
                                  <td className="px-5 py-4 text-center">
                                    {leave.status === 'pending' ? (
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => handleLeaveDecision(leave.id, 'approved')}
                                          className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded-lg transition-all duration-200 cursor-pointer shadow-3xs hover:scale-105"
                                          title="اعتماد الإجازة ومزامنة الأمان"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleLeaveDecision(leave.id, 'rejected')}
                                          className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 rounded-lg transition-all duration-200 cursor-pointer shadow-3xs hover:scale-105"
                                          title="رفض الإجازة"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 font-bold bg-slate-100/40 py-1 px-2.5 rounded-lg border border-slate-200/10 inline-block">
                                        {leave.status === 'approved' ? 'مكتمل ومؤمن' : 'مرفوض ومغلق'}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 2. Self-Service Glassmorphic Leave Application Form (Right Column) */}
                <div className="space-y-6">
                  
                  {/* Glassmorphic Submit Form Card */}
                  <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(15,76,129,0.02)] p-5 rounded-2xl space-y-4">
                    <div className="border-b border-white/40 pb-3">
                      <div className="flex items-center gap-2 text-[#0F4C81]">
                        <Send className="w-4 h-4 text-[#F7941D]" />
                        <h4 className="text-xs font-black text-slate-800">تقديم طلب إجازة سريع للموظف</h4>
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold mt-1">منظومة الخدمة الذاتية لكوادر مصر للأوناش والمعدات</p>
                    </div>

                    <form onSubmit={handleCreateLeaveSubmit} className="space-y-3.5 text-xs text-right">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">الموظف مقدم الطلب *</label>
                        <select
                          required
                          value={newLeaveEmp}
                          onChange={e => setNewLeaveEmp(e.target.value)}
                          className="w-full p-2.5 border border-slate-200/60 bg-white/50 backdrop-blur-xs rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:bg-white transition-all cursor-pointer"
                        >
                          <option value="">-- اختر الموظف الكابتن --</option>
                          {employees.map(e => (
                            <option key={e.id} value={e.name}>{e.name} ({e.role})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1">نوع الإجازة المطلوبة *</label>
                        <select
                          value={newLeaveType}
                          onChange={e => setNewLeaveType(e.target.value as any)}
                          className="w-full p-2.5 border border-slate-200/60 bg-white/50 backdrop-blur-xs rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:bg-white transition-all cursor-pointer"
                        >
                          <option value="annual">إجازة سنوية اعتيادية (رصيد مرصوص)</option>
                          <option value="sick">إجازة مرضية معتمدة (بتقرير طبي)</option>
                          <option value="unpaid">إجازة استثنائية (بدون مرتب)</option>
                          <option value="emergency">إجازة عارضة طارئة (خصم رصيد)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">تاريخ البدء *</label>
                          <input 
                            type="date"
                            required
                            value={newLeaveStart}
                            onChange={e => setNewLeaveStart(e.target.value)}
                            className="w-full p-2.5 border border-slate-200/60 bg-white/50 backdrop-blur-xs rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:bg-white transition-all"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">تاريخ الانتهاء *</label>
                          <input 
                            type="date"
                            required
                            value={newLeaveEnd}
                            onChange={e => setNewLeaveEnd(e.target.value)}
                            className="w-full p-2.5 border border-slate-200/60 bg-white/50 backdrop-blur-xs rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1">مبرر الإجازة بالتفصيل *</label>
                        <textarea 
                          required
                          value={newLeaveReason}
                          onChange={e => setNewLeaveReason(e.target.value)}
                          placeholder="اكتب التوضيح أو المبرر الإداري للطلب..."
                          rows={2}
                          className="w-full p-2.5 border border-slate-200/60 bg-white/50 backdrop-blur-xs rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:bg-white transition-all resize-none"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-2.5 bg-[#0F4C81] hover:bg-[#0f4c81]/90 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01]"
                      >
                        <Send className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span>إرسال الطلب للاعتماد الفوري</span>
                      </button>
                    </form>
                  </div>

                  {/* Remaining annual balances summary */}
                  <div className="bg-white/40 backdrop-blur-md border border-white/60 p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(15,76,129,0.02)] space-y-4">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2.5">رصيد الإجازات السنوية المتبقية</h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-bold leading-relaxed">يستحق موظفو مصر للأوناش ٢١ يوماً سنوياً تزداد إلى ٣٠ يوماً لمن تجاوزت خدمتهم ١٠ سنوات.</p>
                    </div>

                    <div className="space-y-4">
                      {[
                        { label: 'سائق رافعة LR 1600 (محمود الكابتن)', left: 14, total: 21 },
                        { label: 'مدير العمليات الهندسية (أحمد رأفت)', left: 8, total: 30 },
                        { label: 'مشغل رافعة تلسكوبية (سيد جلال)', left: 21, total: 21 },
                        { label: 'مهندس صيانة هيدروليك (شريف فهمي)', left: 5, total: 21 },
                      ].map((item, idx) => {
                        const percentage = (item.left / item.total) * 100;
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black">
                              <span className="text-slate-700 font-extrabold">{item.label}</span>
                              <span className="text-slate-500 font-mono font-bold">{item.left} من {item.total} يوم</span>
                            </div>
                            <div className="w-full bg-slate-200/50 h-2 rounded-full overflow-hidden p-[1px]">
                              <div className="bg-gradient-to-r from-blue-700 to-[#0F4C81] h-full rounded-full transition-all duration-300" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>

            </motion.div>
          )}

          {/* TAB 4: PAYROLL CENTER */}
          {activeTab === 'payroll' && (
            <motion.div
              key="payroll-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              
              {/* Main Payroll KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white/40 backdrop-blur-md border border-white/65 shadow-[0_8px_32px_0_rgba(15,76,129,0.02)] rounded-2xl p-5 flex items-center justify-between hover:scale-[1.01] transition-all duration-300">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold block">إجمالي رواتب الكادر هذا الشهر</span>
                    <p className="text-xl font-black text-slate-800 mt-0.5">
                      {(payrolls.filter(p => p.month === '2026-07').reduce((a,b) => a + b.netSalary, 0)).toLocaleString('ar-EG')} ج.م
                    </p>
                    <span className="text-[9px] text-slate-500 font-bold bg-white/70 border border-slate-100 px-2.5 py-0.5 rounded-full inline-block mt-2 shadow-3xs">
                      مسير رواتب يوليو 2026
                    </span>
                  </div>
                  <div className="p-3 bg-blue-50 text-[#0F4C81] border border-blue-100 rounded-2xl">
                    <Coins className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-emerald-50/40 backdrop-blur-md border border-emerald-100/40 shadow-[0_8px_32px_0_rgba(16,185,129,0.02)] rounded-2xl p-5 flex items-center justify-between hover:scale-[1.01] transition-all duration-300">
                  <div>
                    <span className="text-[10px] text-emerald-600 font-extrabold block">إجمالي الرواتب المصروفة بنجاح</span>
                    <p className="text-xl font-black text-emerald-800 mt-0.5">
                      {(payrolls.filter(p => p.month === '2026-07' && p.status === 'paid').reduce((a,b) => a + b.netSalary, 0)).toLocaleString('ar-EG')} ج.م
                    </p>
                    <span className="text-[9px] text-emerald-600 font-bold bg-emerald-100/50 px-2.5 py-0.5 rounded-full inline-block mt-2 shadow-3xs">
                      محولة للحسابات البنكية المعتمدة
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-100/80 text-emerald-700 border border-emerald-200 rounded-2xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-amber-50/40 backdrop-blur-md border border-amber-100/40 shadow-[0_8px_32px_0_rgba(245,158,11,0.02)] rounded-2xl p-5 flex items-center justify-between hover:scale-[1.01] transition-all duration-300">
                  <div>
                    <span className="text-[10px] text-amber-600 font-extrabold block">رواتب مسودات معلقة للصرف</span>
                    <p className="text-xl font-black text-amber-800 mt-0.5">
                      {(payrolls.filter(p => p.month === '2026-07' && p.status === 'draft').reduce((a,b) => a + b.netSalary, 0)).toLocaleString('ar-EG')} ج.م
                    </p>
                    <span className="text-[9px] text-amber-700 font-bold bg-amber-100/50 px-2.5 py-0.5 rounded-full inline-block mt-2 shadow-3xs">
                      بانتظار الاعتماد المالي المزدوج
                    </span>
                  </div>
                  <div className="p-3 bg-amber-100/80 text-amber-700 border border-amber-200 rounded-2xl">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Action Ribbon & Filters */}
              <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(15,76,129,0.02)] p-5 rounded-2xl flex flex-col lg:flex-row justify-between items-center gap-4">
                
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <div className="relative flex-1 sm:flex-initial sm:w-72">
                    <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="البحث باسم الموظف في الدليل..."
                      value={paySearch}
                      onChange={e => setPaySearch(e.target.value)}
                      className="w-full pr-10 pl-4 py-2.5 border border-slate-200/60 bg-white/50 backdrop-blur-xs rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Month Filter */}
                  <div className="flex items-center gap-1.5 border border-slate-200/60 bg-white/50 backdrop-blur-xs px-3 py-2.5 rounded-xl">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                      value={payMonthFilter}
                      onChange={e => setPayMonthFilter(e.target.value)}
                      className="bg-transparent text-xs font-black text-slate-600 focus:outline-none border-none p-0 pr-1 cursor-pointer"
                    >
                      <option value="all">كل الشهور المالية</option>
                      <option value="2026-07">يوليو 2026 (الحالي)</option>
                      <option value="2026-06">يونيو 2026</option>
                    </select>
                  </div>

                  {/* Payroll Status filter */}
                  <div className="flex items-center gap-1.5 border border-slate-200/60 bg-white/50 backdrop-blur-xs px-3 py-2.5 rounded-xl">
                    <Activity className="w-4 h-4 text-slate-400" />
                    <select
                      value={payStatusFilter}
                      onChange={e => setPayStatusFilter(e.target.value)}
                      className="bg-transparent text-xs font-black text-slate-600 focus:outline-none border-none p-0 pr-1 cursor-pointer"
                    >
                      <option value="all">كل الحالات المالية</option>
                      <option value="draft">مسودة معلقة</option>
                      <option value="paid">تم الصرف بنجاح</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
                  <button 
                    onClick={() => handleExportData(
                      filteredPayrollsList,
                      ['اسم الموظف', 'الشهر المالي', 'الراتب الأساسي', 'البدلات والمكافآت', 'الخصومات والمستقطعات', 'صافي الراتب المستحق', 'الحالة المالية'],
                      ['empName', 'month', 'basicSalary', 'allowances', 'deductions', 'netSalary', 'status'],
                      'EgyptCranes_Payroll_Disbursements'
                    )}
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200/80 bg-white/60 backdrop-blur-xs hover:bg-white transition-all rounded-xl text-xs font-bold text-slate-600 shadow-sm cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>تصدير كشف الرواتب (Excel)</span>
                  </button>

                  {isHRAdmin && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowGenPayrollModal(true)}
                        className="px-4 py-2.5 bg-[#0F4C81] hover:bg-[#0f4c81]/90 text-white transition-all rounded-xl text-xs font-black shadow-md hover:shadow-lg hover:scale-[1.01] cursor-pointer"
                      >
                        إصدار مسير جديد
                      </button>
                      
                      <button 
                        onClick={handleDisburseAllDrafts}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white transition-all rounded-xl text-xs font-black shadow-md hover:shadow-lg hover:scale-[1.01] cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        <span>اعتماد وصرف الكل البنكي</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Payroll Records Table with Glassmorphic design */}
              <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(15,76,129,0.02)] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-100/50 text-slate-500 text-xs font-black border-b border-slate-200/40">
                        <th className="px-6 py-4">اسم الموظف الكابتن</th>
                        <th className="px-6 py-4 text-center">الدورة المالية</th>
                        <th className="px-6 py-4 text-center">الراتب الأساسي</th>
                        <th className="px-6 py-4 text-center">الحوافز والبدلات التشغيلية</th>
                        <th className="px-6 py-4 text-center">الجزاءات والمستقطعات</th>
                        <th className="px-6 py-4 text-center">صافي الراتب المحول</th>
                        <th className="px-6 py-4 text-center">الحالة الإدارية</th>
                        <th className="px-6 py-4 text-center">الإجراء المالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/30 text-xs font-bold">
                      {filteredPayrollsList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-16 text-center text-slate-400 font-extrabold bg-white/20">
                            لا توجد مسيرات رواتب مطابقة للتصفية الحالية في السجلات
                          </td>
                        </tr>
                      ) : (
                        filteredPayrollsList.map(pay => (
                          <tr key={pay.id} className="hover:bg-white/40 transition-colors duration-150">
                            <td className="px-6 py-4 text-slate-800 font-black">{pay.empName}</td>
                            <td className="px-6 py-4 text-center text-slate-500 font-mono font-bold">{pay.month}</td>
                            <td className="px-6 py-4 text-center text-slate-600 font-mono font-bold">
                              {pay.basicSalary.toLocaleString('ar-EG')} ج.م
                            </td>
                            <td className="px-6 py-4 text-center text-emerald-700 font-mono font-bold">
                              +{pay.allowances.toLocaleString('ar-EG')} ج.م
                            </td>
                            <td className="px-6 py-4 text-center text-rose-600 font-mono font-bold">
                              {pay.deductions > 0 ? `-${pay.deductions.toLocaleString('ar-EG')} ج.م` : '—'}
                            </td>
                            <td className="px-6 py-4 text-center text-[#0F4C81] font-black font-mono text-xs">
                              {pay.netSalary.toLocaleString('ar-EG')} ج.م
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-black shadow-3xs ${
                                pay.status === 'paid' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' 
                                  : 'bg-amber-50 text-amber-700 border border-amber-100/50 animate-pulse'
                              }`}>
                                {pay.status === 'paid' ? 'تم التحويل والصرف البنكي' : 'مسودة معلقة للاعتماد'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {pay.status === 'draft' && isHRAdmin ? (
                                <button
                                  onClick={() => handleDisburseIndividual(pay.id)}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg transition-all cursor-pointer shadow-3xs"
                                >
                                  اعتماد وصرف بنكي
                                </button>
                              ) : (
                                <span className="text-slate-400 font-bold text-[10px] bg-slate-100/40 py-1 px-2.5 rounded-lg border border-slate-200/10">مكتمل ومعتمد</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 5: EMPLOYEE LOANS MODULE (السلف المالية والاستقطاعات) */}
          {activeTab === 'loans' && (
            <motion.div
              key="loans-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* KPIs Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white/40 backdrop-blur-md border border-white/65 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold block">إجمالي السلف المالية القائمة</span>
                    <p className="text-xl font-black text-slate-800 mt-0.5">
                      {loans.reduce((a, b) => a + b.amount, 0).toLocaleString('ar-EG')} ج.م
                    </p>
                    <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full inline-block mt-2">
                      {loans.length} طلبات مسجلة بالنظام
                    </span>
                  </div>
                  <div className="p-3 bg-blue-50 text-[#0F4C81] rounded-2xl">
                    <HandCoins className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-emerald-50/40 backdrop-blur-md border border-emerald-100/40 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-600 font-extrabold block">إجمالي المبالغ المستردة عبر الرواتب</span>
                    <p className="text-xl font-black text-emerald-800 mt-0.5">
                      {loans.reduce((a, b) => a + b.paidAmount, 0).toLocaleString('ar-EG')} ج.m
                    </p>
                    <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100/50 px-2.5 py-0.5 rounded-full inline-block mt-2">
                      خصم تلقائي من كشوف الرواتب
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-100/80 text-emerald-700 rounded-2xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-amber-50/40 backdrop-blur-md border border-amber-100/40 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-amber-600 font-extrabold block">المبالغ المتبقية للتحصيل</span>
                    <p className="text-xl font-black text-amber-800 mt-0.5">
                      {loans.reduce((a, b) => a + b.remainingAmount, 0).toLocaleString('ar-EG')} ج.م
                    </p>
                    <span className="text-[9px] text-amber-700 font-bold bg-amber-100/50 px-2.5 py-0.5 rounded-full inline-block mt-2">
                      أقساط شهرية مجدولة
                    </span>
                  </div>
                  <div className="p-3 bg-amber-100/80 text-amber-700 rounded-2xl">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Action & Search Ribbon */}
              <div className="bg-white/40 backdrop-blur-md border border-white/60 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                  <div className="relative flex-1 sm:w-80">
                    <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="البحث باسم الموظف أو رقم السلفة..."
                      value={loanSearch}
                      onChange={e => setLoanSearch(e.target.value)}
                      className="w-full pr-10 pl-4 py-2.5 border border-slate-200/60 bg-white/50 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setShowAddLoanModal(true)}
                  className="px-4 py-2.5 bg-[#0F4C81] text-white rounded-xl text-xs font-black hover:bg-[#0c3d67] transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>تقديم طلب سلفة جديدة</span>
                </button>
              </div>

              {/* Loans List Table */}
              <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-100/60 text-slate-500 text-xs font-black border-b border-slate-200/50">
                        <th className="px-5 py-4">رقم السلفة والموظف</th>
                        <th className="px-4 py-4 text-center">القسم والوظيفة</th>
                        <th className="px-4 py-4 text-center">قيمة السلفة</th>
                        <th className="px-4 py-4 text-center">القسط الشهرى</th>
                        <th className="px-4 py-4 text-center">الأقساط (المسدد/المرتجع)</th>
                        <th className="px-4 py-4 text-center">دورة الموافقة الإدارية</th>
                        <th className="px-4 py-4 text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/30 text-xs font-bold">
                      {loans
                        .filter(l => l.empName.toLowerCase().includes(loanSearch.toLowerCase()) || l.loanNo.toLowerCase().includes(loanSearch.toLowerCase()))
                        .map(loan => (
                          <tr key={loan.id} className="hover:bg-white/50 transition-colors">
                            <td className="px-5 py-4">
                              <div className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block mb-1 font-black">
                                {loan.loanNo}
                              </div>
                              <p className="font-black text-slate-800 text-xs">{loan.empName}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{loan.reason}</p>
                            </td>
                            <td className="px-4 py-4 text-center text-slate-600">
                              <p>{loan.jobTitle}</p>
                              <span className="text-[10px] text-slate-400">{loan.department}</span>
                            </td>
                            <td className="px-4 py-4 text-center font-mono font-black text-slate-800">
                              {loan.amount.toLocaleString('ar-EG')} ج.م
                            </td>
                            <td className="px-4 py-4 text-center font-mono font-black text-rose-600">
                              {loan.monthlyInstallment.toLocaleString('ar-EG')} ج.م / شهر
                            </td>
                            <td className="px-4 py-4 text-center font-mono">
                              <span className="text-emerald-700 font-black">{loan.paidAmount.toLocaleString('ar-EG')}</span> / <span className="text-amber-700 font-black">{loan.remainingAmount.toLocaleString('ar-EG')}</span> ج.م
                              <div className="text-[9px] text-slate-400 mt-0.5">({loan.installmentsCount} أقساط)</div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {loan.approvalWorkflow.map((wf, idx) => (
                                  <div
                                    key={idx}
                                    className={`px-2 py-1 rounded-md text-[9px] font-black border ${
                                      wf.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      wf.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                      'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}
                                    title={`${wf.role}: ${wf.status}`}
                                  >
                                    {wf.role.split(' ')[0]}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                                loan.status === 'approved' || loan.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                loan.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                loan.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                              }`}>
                                {loan.status === 'approved' || loan.status === 'active' ? 'نشطة وخصم قائم' :
                                 loan.status === 'completed' ? 'مسددة بالكامل' :
                                 loan.status === 'rejected' ? 'مرفوضة' : 'بانتظار الموافقة'}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 6: EMPLOYEE CUSTODY & ASSET MANAGEMENT (إدارة العُهد والمالية والأصول للموظفين) */}
          {activeTab === 'custodies' && (
            <motion.div
              key="custodies-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Custody Sub-Navigation Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white/60 backdrop-blur-md p-2 rounded-2xl border border-white/80 shadow-3xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCustodySubView('list')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                      custodySubView === 'list'
                        ? 'bg-[#0F4C81] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100/80'
                    }`}
                  >
                    <Laptop className="w-4 h-4" />
                    <span>سجل وتخصيص العُهد التشغيلية</span>
                  </button>

                  <button
                    onClick={() => setCustodySubView('reports')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                      custodySubView === 'reports'
                        ? 'bg-[#0F4C81] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100/80'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-amber-300" />
                    <span>تقارير استهلاك وتدقيق العُهد (Auditing Reports)</span>
                    <span className="bg-amber-400 text-slate-900 text-[9px] font-black px-2 py-0.5 rounded-full shadow-3xs">جديد</span>
                  </button>
                </div>

                {custodySubView === 'reports' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportCustodyConsumptionPDF}
                      disabled={isGeneratingPdf}
                      className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-xl text-xs font-black hover:from-rose-700 hover:to-rose-800 transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <Printer className="w-4 h-4" />
                      <span>{isGeneratingPdf ? 'جاري التوليد...' : 'تصدير التقرير المعتمد (PDF)'}</span>
                    </button>

                    <button
                      onClick={() => handleExportData(
                        custodies.map(c => ({
                          requestNo: c.requestNo || c.id,
                          empName: c.empName,
                          department: c.department || 'العمليات والصيانة',
                          type: c.custodyType === 'financial' ? 'مالية' : 'عينية',
                          assetName: c.assetName,
                          valueOrSN: c.custodyType === 'financial' ? c.amount : c.serialNumber,
                          assignedDate: c.assignedDate,
                          estimatedSettlementDate: c.estimatedSettlementDate || '-',
                          status: c.status,
                          isOverdue: isCustodyOverdue(c) ? 'متأخرة' : 'منتظمة'
                        })),
                        ['رقم الطلب', 'الموظف', 'القسم', 'نوع العهدة', 'بيان العهدة', 'القيمة/الرقم', 'تاريخ التسليم', 'مهلة التسوية', 'الحالة', 'موقف التأخير'],
                        ['requestNo', 'empName', 'department', 'type', 'assetName', 'valueOrSN', 'assignedDate', 'estimatedSettlementDate', 'status', 'isOverdue'],
                        'EgyptCranes_Custody_Consumption_Audit'
                      )}
                      className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-3xs cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>Excel</span>
                    </button>
                  </div>
                )}
              </div>

              {custodySubView === 'reports' ? (
                /* REPORT VIEW */
                <div className="space-y-6">
                  {/* Category Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Open Custodies */}
                    <div 
                      onClick={() => setCustodyReportStatusFilter('open')}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer backdrop-blur-md ${
                        custodyReportStatusFilter === 'open'
                          ? 'bg-blue-50/90 border-blue-300 ring-2 ring-blue-500/20 shadow-md'
                          : 'bg-white/40 border-white/60 hover:bg-white/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-blue-700 font-extrabold">العهد المفتوحة والقائمة</span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold">قيد التشغيل</span>
                      </div>
                      <p className="text-xl font-black text-slate-800 mt-2">
                        {custodies.filter(c => c.status === 'assigned' || c.status === 'approved' || c.status === 'pending' || c.status === 'under_review').length} <span className="text-xs font-normal text-slate-500">عُهدة</span>
                      </p>
                      <div className="mt-2 text-[11px] font-bold text-blue-800 flex items-center justify-between">
                        <span>القيمة النقدية القائمة:</span>
                        <span className="font-mono font-black">
                          {custodies.filter(c => (c.status === 'assigned' || c.status === 'approved' || c.status === 'pending' || c.status === 'under_review') && c.custodyType === 'financial')
                            .reduce((a, b) => a + (b.amount || 0), 0).toLocaleString('ar-EG')} ج.م
                        </span>
                      </div>
                    </div>

                    {/* Settled Custodies */}
                    <div 
                      onClick={() => setCustodyReportStatusFilter('settled')}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer backdrop-blur-md ${
                        custodyReportStatusFilter === 'settled'
                          ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/20 shadow-md'
                          : 'bg-white/40 border-white/60 hover:bg-white/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-emerald-700 font-extrabold">العهد المستقرة والمسواة</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">مغلقة ومسترجعة</span>
                      </div>
                      <p className="text-xl font-black text-slate-800 mt-2">
                        {custodies.filter(c => c.status === 'settled' || c.status === 'returned' || c.settlementStatus === 'settled').length} <span className="text-xs font-normal text-slate-500">عُهدة</span>
                      </p>
                      <div className="mt-2 text-[11px] font-bold text-emerald-800 flex items-center justify-between">
                        <span>المبلغ المسوى دفترياً:</span>
                        <span className="font-mono font-black">
                          {custodies.filter(c => c.status === 'settled' || c.settlementStatus === 'settled')
                            .reduce((a, b) => a + (b.settledAmount || b.amount || 0), 0).toLocaleString('ar-EG')} ج.م
                        </span>
                      </div>
                    </div>

                    {/* Overdue Custodies */}
                    <div 
                      onClick={() => setCustodyReportStatusFilter('overdue')}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer backdrop-blur-md ${
                        custodyReportStatusFilter === 'overdue'
                          ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-500/20 shadow-md'
                          : 'bg-white/40 border-white/60 hover:bg-white/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-rose-700 font-extrabold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>العهد المتأخرة عن التسوية</span>
                        </span>
                        <span className="text-[10px] bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                          تجاوزت المهلة
                        </span>
                      </div>
                      <p className="text-xl font-black text-rose-800 mt-2">
                        {custodies.filter(c => isCustodyOverdue(c)).length} <span className="text-xs font-normal text-rose-600">عُهد متأخرة</span>
                      </p>
                      <div className="mt-2 text-[11px] font-bold text-rose-800 flex items-center justify-between">
                        <span>مبالغ تتطلب المساءلة:</span>
                        <span className="font-mono font-black">
                          {custodies.filter(c => isCustodyOverdue(c) && c.custodyType === 'financial')
                            .reduce((a, b) => a + (b.amount || 0), 0).toLocaleString('ar-EG')} ج.م
                        </span>
                      </div>
                    </div>

                    {/* Total Custodies */}
                    <div 
                      onClick={() => setCustodyReportStatusFilter('all')}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer backdrop-blur-md ${
                        custodyReportStatusFilter === 'all'
                          ? 'bg-slate-100/90 border-slate-300 ring-2 ring-slate-500/20 shadow-md'
                          : 'bg-white/40 border-white/60 hover:bg-white/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-600 font-extrabold">إجمالي السجل الموثق</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">التقرير الشامل</span>
                      </div>
                      <p className="text-xl font-black text-slate-800 mt-2">
                        {custodies.length} <span className="text-xs font-normal text-slate-500">عُهدة إجمالية</span>
                      </p>
                      <div className="mt-2 text-[11px] font-bold text-slate-700 flex items-center justify-between">
                        <span>نسبة الالتزام بالتسوية:</span>
                        <span className="font-mono font-black text-emerald-700">
                          {custodies.length > 0
                            ? Math.round((custodies.filter(c => c.status === 'settled' || c.status === 'returned').length / custodies.length) * 100)
                            : 100}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Filter Ribbon */}
                  <div className="bg-white/40 backdrop-blur-md border border-white/60 p-4 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto flex-1">
                      {/* Report Status Filter Tabs */}
                      <div className="flex bg-slate-200/60 p-1 rounded-xl gap-1 overflow-x-auto w-full sm:w-auto">
                        <button
                          onClick={() => setCustodyReportStatusFilter('all')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            custodyReportStatusFilter === 'all' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          جميع العُهد ({custodies.length})
                        </button>
                        <button
                          onClick={() => setCustodyReportStatusFilter('open')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            custodyReportStatusFilter === 'open' ? 'bg-blue-600 text-white shadow-3xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span>العهد المفتوحة</span>
                          <span className="bg-blue-100 text-blue-800 text-[9px] px-1.5 py-0.2 rounded-full">
                            {custodies.filter(c => c.status === 'assigned' || c.status === 'approved' || c.status === 'pending' || c.status === 'under_review').length}
                          </span>
                        </button>
                        <button
                          onClick={() => setCustodyReportStatusFilter('settled')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            custodyReportStatusFilter === 'settled' ? 'bg-emerald-600 text-white shadow-3xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span>العهد المستقرة</span>
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.2 rounded-full">
                            {custodies.filter(c => c.status === 'settled' || c.status === 'returned' || c.settlementStatus === 'settled').length}
                          </span>
                        </button>
                        <button
                          onClick={() => setCustodyReportStatusFilter('overdue')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            custodyReportStatusFilter === 'overdue' ? 'bg-rose-600 text-white shadow-3xs animate-pulse' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>العهد المتأخرة</span>
                          <span className="bg-rose-100 text-rose-800 text-[9px] px-1.5 py-0.2 rounded-full font-black">
                            {custodies.filter(c => isCustodyOverdue(c)).length}
                          </span>
                        </button>
                      </div>

                      {/* Category Filter */}
                      <div className="flex items-center gap-1.5 border border-slate-200/60 bg-white/60 px-3 py-1.5 rounded-xl text-xs font-bold">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          value={custodyReportCategoryFilter}
                          onChange={e => setCustodyReportCategoryFilter(e.target.value as any)}
                          className="bg-transparent text-slate-700 font-bold focus:outline-none cursor-pointer"
                        >
                          <option value="all">كل أنواع العُهد (مالية وعينية)</option>
                          <option value="financial">عُهد مالية ونقدية فقط</option>
                          <option value="material">عُهد عينية ومعدات فقط</option>
                        </select>
                      </div>

                      {/* Department Filter */}
                      <div className="flex items-center gap-1.5 border border-slate-200/60 bg-white/60 px-3 py-1.5 rounded-xl text-xs font-bold">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          value={custodyReportDeptFilter}
                          onChange={e => setCustodyReportDeptFilter(e.target.value)}
                          className="bg-transparent text-slate-700 font-bold focus:outline-none cursor-pointer"
                        >
                          <option value="all">كل الأقسام الإدارية</option>
                          {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full lg:w-64">
                      <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="البحث بالموظف، البيان، رقم الطلب..."
                        value={custodyReportSearch}
                        onChange={e => setCustodyReportSearch(e.target.value)}
                        className="w-full pr-10 pl-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                      />
                    </div>
                  </div>

                  {/* Report Data Table */}
                  <div className="bg-white/50 backdrop-blur-md border border-white/70 rounded-2xl overflow-hidden shadow-xs">
                    <div className="p-4 bg-slate-100/50 border-b border-slate-200/60 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#0F4C81]" />
                        <span className="text-xs font-black text-slate-800">بيانات التقرير والتدقيق الإداري المفصل</span>
                        <span className="text-[10px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {
                            custodies.filter(c => {
                              const isOverdue = isCustodyOverdue(c);
                              const isOpen = c.status === 'assigned' || c.status === 'approved' || c.status === 'pending' || c.status === 'under_review';
                              const isSettled = c.status === 'settled' || c.status === 'returned' || c.settlementStatus === 'settled';

                              if (custodyReportStatusFilter === 'open' && !isOpen) return false;
                              if (custodyReportStatusFilter === 'settled' && !isSettled) return false;
                              if (custodyReportStatusFilter === 'overdue' && !isOverdue) return false;

                              if (custodyReportCategoryFilter === 'financial' && c.custodyType !== 'financial') return false;
                              if (custodyReportCategoryFilter === 'material' && c.custodyType === 'financial') return false;

                              if (custodyReportDeptFilter !== 'all' && c.department !== custodyReportDeptFilter) return false;

                              if (custodyReportSearch) {
                                const q = custodyReportSearch.toLowerCase();
                                const matchName = c.empName.toLowerCase().includes(q);
                                const matchAsset = c.assetName.toLowerCase().includes(q);
                                const matchReq = (c.requestNo || '').toLowerCase().includes(q);
                                if (!matchName && !matchAsset && !matchReq) return false;
                              }

                              return true;
                            }).length
                          } نتيجة مطابقة
                        </span>
                      </div>

                      <button
                        onClick={handleExportCustodyConsumptionPDF}
                        disabled={isGeneratingPdf}
                        className="text-xs font-black text-rose-700 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>طباعة PDF المعتمد</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-slate-100/80 text-slate-600 text-xs font-black border-b border-slate-200">
                            <th className="px-5 py-3.5">رقم الطلب / الموظف</th>
                            <th className="px-4 py-3.5">بيان العُهدة ونوع الاستهلاك</th>
                            <th className="px-4 py-3.5 text-center">القيمة المالية / S/N</th>
                            <th className="px-4 py-3.5 text-center">تاريخ التسليم والمهلة</th>
                            <th className="px-4 py-3.5 text-center">موقف التأخير</th>
                            <th className="px-4 py-3.5 text-center">الحالة والوضع الرقابي</th>
                            <th className="px-5 py-3.5 text-center">الإجراء الموصى به</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/50 text-xs font-bold">
                          {custodies
                            .filter(c => {
                              const isOverdue = isCustodyOverdue(c);
                              const isOpen = c.status === 'assigned' || c.status === 'approved' || c.status === 'pending' || c.status === 'under_review';
                              const isSettled = c.status === 'settled' || c.status === 'returned' || c.settlementStatus === 'settled';

                              if (custodyReportStatusFilter === 'open' && !isOpen) return false;
                              if (custodyReportStatusFilter === 'settled' && !isSettled) return false;
                              if (custodyReportStatusFilter === 'overdue' && !isOverdue) return false;

                              if (custodyReportCategoryFilter === 'financial' && c.custodyType !== 'financial') return false;
                              if (custodyReportCategoryFilter === 'material' && c.custodyType === 'financial') return false;

                              if (custodyReportDeptFilter !== 'all' && c.department !== custodyReportDeptFilter) return false;

                              if (custodyReportSearch) {
                                const q = custodyReportSearch.toLowerCase();
                                const matchName = c.empName.toLowerCase().includes(q);
                                const matchAsset = c.assetName.toLowerCase().includes(q);
                                const matchReq = (c.requestNo || '').toLowerCase().includes(q);
                                if (!matchName && !matchAsset && !matchReq) return false;
                              }

                              return true;
                            })
                            .map(custody => {
                              const isOverdue = isCustodyOverdue(custody);
                              const isFin = custody.custodyType === 'financial';

                              let delayDays = 0;
                              if (custody.estimatedSettlementDate && (custody.status !== 'settled' && custody.status !== 'returned')) {
                                const estTime = new Date(custody.estimatedSettlementDate).getTime();
                                const nowTime = new Date().getTime();
                                const diff = Math.floor((nowTime - estTime) / (1000 * 60 * 60 * 24));
                                if (diff > 0) delayDays = diff;
                              }

                              return (
                                <tr 
                                  key={custody.id} 
                                  className={`hover:bg-white/80 transition-colors ${
                                    isOverdue ? 'bg-rose-50/40' : ''
                                  }`}
                                >
                                  <td className="px-5 py-4">
                                    <span className={`font-mono text-[9px] font-black px-2 py-0.5 rounded-md inline-block mb-1 border ${
                                      isFin ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}>
                                      {custody.requestNo || custody.id.substring(0, 8)}
                                    </span>
                                    <p className="font-black text-slate-800 text-xs">{custody.empName}</p>
                                    <span className="text-[10px] text-slate-500 font-medium">{custody.department || 'إدارة التشغيل والصيانة'}</span>
                                  </td>

                                  <td className="px-4 py-4">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${
                                        isFin ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                                      }`}>
                                        {isFin ? '💵 عُهدة مالية' : '📦 عُهدة عينية'}
                                      </span>
                                      {custody.expenseCategory && (
                                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-50 text-blue-700">
                                          {custody.expenseCategory}
                                        </span>
                                      )}
                                    </div>
                                    <p className="font-black text-slate-800 text-xs">{custody.assetName}</p>
                                    {custody.financialPurpose && (
                                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{custody.financialPurpose}</p>
                                    )}
                                  </td>

                                  <td className="px-4 py-4 text-center font-mono font-black">
                                    {isFin ? (
                                      <span className="text-emerald-700 text-sm">
                                        {(custody.amount || 0).toLocaleString('ar-EG')} ج.م
                                      </span>
                                    ) : (
                                      <span className="text-slate-700 text-xs">
                                        {custody.serialNumber || 'بدون سيريال'}
                                      </span>
                                    )}
                                  </td>

                                  <td className="px-4 py-4 text-center font-mono text-slate-600 text-[11px]">
                                    <p><span className="text-slate-400 text-[9px]">تاريخ التسليم:</span> {custody.assignedDate}</p>
                                    {custody.estimatedSettlementDate ? (
                                      <p className={`text-[10px] font-bold mt-0.5 ${isOverdue ? 'text-rose-600' : 'text-amber-700'}`}>
                                        <span className="text-slate-400 text-[9px]">المهلة المتوقعة:</span> {custody.estimatedSettlementDate}
                                      </p>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 font-medium">بدون تاريخ تسوية</span>
                                    )}
                                  </td>

                                  <td className="px-4 py-4 text-center">
                                    {delayDays > 0 ? (
                                      <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-[10px] font-black border border-rose-200 inline-flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                                        <span>تأخير {delayDays} يوم</span>
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200">
                                        سارية ومنتظمة
                                      </span>
                                    )}
                                  </td>

                                  <td className="px-4 py-4 text-center">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                                      custody.status === 'settled' || custody.settlementStatus === 'settled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      custody.status === 'returned' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                                      isOverdue ? 'bg-rose-100 text-rose-800 border-rose-300 font-black animate-pulse' :
                                      custody.status === 'approved' || custody.status === 'assigned' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                      {custody.status === 'settled' || custody.settlementStatus === 'settled' ? 'مسواة بالكامل' :
                                       custody.status === 'returned' ? 'مسترجعة للمخزن' :
                                       isOverdue ? '⚠️ متأخرة عن التسوية' :
                                       custody.status === 'approved' || custody.status === 'assigned' ? 'مفتوحة قائمة' :
                                       'قيد الاعتماد'}
                                    </span>
                                  </td>

                                  <td className="px-5 py-4 text-center">
                                    {isFin && (custody.status === 'approved' || isOverdue) && custody.settlementStatus !== 'settled' ? (
                                      <button
                                        onClick={() => {
                                          setSelectedCustodyForSettlement(custody);
                                          setSettlementActualAmount(custody.amount || 0);
                                        }}
                                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-black transition-all shadow-3xs cursor-pointer inline-flex items-center gap-1"
                                      >
                                        <Receipt className="w-3.5 h-3.5" />
                                        <span>تسوية الفواتير</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => setSelectedCustodyForReceipt(custody)}
                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                                      >
                                        <Printer className="w-3.5 h-3.5" />
                                        <span>عرض الإقرار</span>
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                /* EXISTING LIST VIEW */
                <>
                  {/* KPIs Header */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/40 backdrop-blur-md border border-white/65 rounded-2xl p-5 flex items-center justify-between shadow-3xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-extrabold block">إجمالي العُهد النقدية القائمة</span>
                        <p className="text-lg font-black text-slate-800 mt-0.5">
                          {custodies.filter(c => c.custodyType === 'financial' && c.status !== 'settled' && c.status !== 'rejected').reduce((a, b) => a + (b.amount || 0), 0).toLocaleString('ar-EG')} ج.م
                        </p>
                    <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full inline-block mt-2">
                      {custodies.filter(c => c.custodyType === 'financial').length} طلبات مالية مسجلة
                    </span>
                  </div>
                  <div className="p-3 bg-blue-50 text-[#0F4C81] rounded-2xl">
                    <Banknote className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-amber-50/40 backdrop-blur-md border border-amber-100/40 rounded-2xl p-5 flex items-center justify-between shadow-3xs">
                  <div>
                    <span className="text-[10px] text-amber-600 font-extrabold block">طلبات قيد سريان الاعتماد</span>
                    <p className="text-lg font-black text-amber-800 mt-0.5">
                      {custodies.filter(c => c.status === 'pending' || c.status === 'under_review').length} طلبات
                    </p>
                    <span className="text-[9px] text-amber-700 font-bold bg-amber-100/50 px-2.5 py-0.5 rounded-full inline-block mt-2">
                      موزعة على سير العمل
                    </span>
                  </div>
                  <div className="p-3 bg-amber-100/80 text-amber-700 rounded-2xl">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-purple-50/40 backdrop-blur-md border border-purple-100/40 rounded-2xl p-5 flex items-center justify-between shadow-3xs">
                  <div>
                    <span className="text-[10px] text-purple-600 font-extrabold block">عُهد بانتظار التسوية المستندية</span>
                    <p className="text-lg font-black text-purple-800 mt-0.5">
                      {custodies.filter(c => c.custodyType === 'financial' && c.status === 'approved' && c.settlementStatus !== 'settled').length} عُهد
                    </p>
                    <span className="text-[9px] text-purple-700 font-bold bg-purple-100/50 px-2.5 py-0.5 rounded-full inline-block mt-2">
                      تتطلب إرفاق الفواتير
                    </span>
                  </div>
                  <div className="p-3 bg-purple-100/80 text-purple-700 rounded-2xl">
                    <Receipt className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-emerald-50/40 backdrop-blur-md border border-emerald-100/40 rounded-2xl p-5 flex items-center justify-between shadow-3xs">
                  <div>
                    <span className="text-[10px] text-emerald-600 font-extrabold block">عُهد عينية مخصصة (أجهزة)</span>
                    <p className="text-lg font-black text-emerald-800 mt-0.5">
                      {custodies.filter(c => c.custodyType !== 'financial' && c.status === 'assigned').length} عُهد
                    </p>
                    <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100/50 px-2.5 py-0.5 rounded-full inline-block mt-2">
                      مرفقة بإقرار استلام QR
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-100/80 text-emerald-700 rounded-2xl">
                    <Laptop className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Action & Filter Ribbon */}
              <div className="bg-white/40 backdrop-blur-md border border-white/60 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
                  <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="البحث باسم الموظف، الرقم التسلسلي، أو بيان الطلب..."
                      value={custodySearch}
                      onChange={e => setCustodySearch(e.target.value)}
                      className="w-full pr-10 pl-4 py-2.5 border border-slate-200/60 bg-white/50 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                    />
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex bg-slate-100/80 p-1 rounded-xl gap-1">
                    <button
                      onClick={() => setCustodyTypeFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        custodyTypeFilter === 'all' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      الكل
                    </button>
                    <button
                      onClick={() => setCustodyTypeFilter('financial')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        custodyTypeFilter === 'financial' ? 'bg-white text-[#0F4C81] shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>عُهد مالية</span>
                    </button>
                    <button
                      onClick={() => setCustodyTypeFilter('material')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        custodyTypeFilter === 'material' ? 'bg-white text-emerald-800 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Laptop className="w-3.5 h-3.5" />
                      <span>عُهد عينية</span>
                    </button>
                    <button
                      onClick={() => setCustodyTypeFilter('workflow')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        custodyTypeFilter === 'workflow' ? 'bg-white text-amber-800 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>قيد الاعتماد</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddCustodyModal(true)}
                  className="px-4 py-2.5 bg-[#0F4C81] text-white rounded-xl text-xs font-black hover:bg-[#0c3d67] transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>طلب عُهدة مالية / عينية جديدة</span>
                </button>
              </div>

              {/* Custody Table */}
              <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-100/60 text-slate-500 text-xs font-black border-b border-slate-200/50">
                        <th className="px-5 py-4">رقم الطلب والموظف</th>
                        <th className="px-4 py-4">نوع العُهدة والبيان التشغيلي</th>
                        <th className="px-4 py-4 text-center">المكون المالي / S/N</th>
                        <th className="px-4 py-4 text-center">التواريخ والمهلة</th>
                        <th className="px-4 py-4 text-center">دورة الاعتماد المالي</th>
                        <th className="px-4 py-4 text-center">الحالة والتسوية</th>
                        <th className="px-5 py-4 text-center">الإجراءات والعمليات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/30 text-xs font-bold">
                      {custodies
                        .filter(c => {
                          const matchesSearch = c.empName.toLowerCase().includes(custodySearch.toLowerCase()) || 
                            c.assetName.toLowerCase().includes(custodySearch.toLowerCase()) || 
                            c.serialNumber.toLowerCase().includes(custodySearch.toLowerCase()) ||
                            (c.requestNo && c.requestNo.toLowerCase().includes(custodySearch.toLowerCase()));
                          
                          if (!matchesSearch) return false;
                          if (custodyTypeFilter === 'financial') return c.custodyType === 'financial';
                          if (custodyTypeFilter === 'material') return c.custodyType !== 'financial';
                          if (custodyTypeFilter === 'workflow') return c.status === 'pending' || c.status === 'under_review';
                          return true;
                        })
                        .map(custody => {
                          const isFin = custody.custodyType === 'financial';
                          return (
                            <tr key={custody.id} className="hover:bg-white/50 transition-colors">
                              <td className="px-5 py-4">
                                {custody.requestNo && (
                                  <span className={`font-mono text-[9px] font-black px-2 py-0.5 rounded-md inline-block mb-1 border ${
                                    isFin ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                  }`}>
                                    {custody.requestNo}
                                  </span>
                                )}
                                <p className="font-black text-slate-800 text-xs">{custody.empName}</p>
                                <span className="text-[10px] text-slate-400 font-medium">{custody.department || 'إدارة التشغيل والصيانة'}</span>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${
                                    isFin ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {isFin ? '💵 عُهدة مالية' : '📦 عُهدة عينية'}
                                  </span>
                                  {custody.expenseCategory && (
                                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-50 text-blue-700">
                                      {custody.expenseCategory}
                                    </span>
                                  )}
                                </div>
                                <p className="font-black text-slate-800 text-xs">{custody.assetName}</p>
                                {custody.costCenterName && (
                                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">مركز الكلفة: {custody.costCenterName}</p>
                                )}
                              </td>
                              <td className="px-4 py-4 text-center font-mono font-black">
                                {isFin ? (
                                  <span className="text-emerald-700 text-sm">
                                    {(custody.amount || 0).toLocaleString('ar-EG')} ج.م
                                  </span>
                                ) : (
                                  <span className="text-slate-700 text-xs">
                                    {custody.serialNumber}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-center font-mono text-slate-600 text-[11px]">
                                <p><span className="text-slate-400 text-[9px]">تاريخ الطلب:</span> {custody.assignedDate}</p>
                                {custody.estimatedSettlementDate && (
                                  <p className="text-[10px] text-amber-700 font-bold mt-0.5">
                                    <span className="text-slate-400 text-[9px]">تاريخ التسوية:</span> {custody.estimatedSettlementDate}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-4 text-center">
                                {custody.approvalWorkflow && custody.approvalWorkflow.length > 0 ? (
                                  <div className="flex items-center justify-center gap-1">
                                    {custody.approvalWorkflow.map((step, idx) => (
                                      <div
                                        key={idx}
                                        className={`px-2 py-1 rounded-md text-[9px] font-black border ${
                                          step.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                          step.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                          'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}
                                        title={`${step.role}: ${step.status === 'approved' ? 'معتمد' : step.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار'}`}
                                      >
                                        {step.role.split(' ')[0]}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-bold">تخصيص مباشر</span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                                    custody.status === 'approved' || custody.status === 'assigned' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    custody.status === 'settled' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    custody.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                    custody.status === 'returned' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                                    'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                                  }`}>
                                    {custody.status === 'approved' ? 'معتمدة - مصروضة' :
                                     custody.status === 'assigned' ? 'على عُهدة الموظف' :
                                     custody.status === 'settled' ? 'مسواة بالكامل' :
                                     custody.status === 'rejected' ? 'مرفوضة' :
                                     custody.status === 'returned' ? 'مسترجعة للمخزن' : 'تحت المراجعة'}
                                  </span>

                                  {isFin && custody.settlementStatus === 'settled' && (
                                    <span className="text-[9px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
                                      تم إرفاق الفواتير ({custody.settledAmount?.toLocaleString('ar-EG')} ج.م)
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-4 text-center">
                                <div className="flex flex-wrap items-center justify-center gap-1.5">
                                  {/* Approval Workflow Trigger Button */}
                                  {isFin && (custody.status === 'pending' || custody.status === 'under_review') && (
                                    <button
                                      onClick={() => setSelectedCustodyForApproval(custody)}
                                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-3xs"
                                    >
                                      <ShieldCheck className="w-3 h-3" />
                                      <span>اعتماد الخطوة</span>
                                    </button>
                                  )}

                                  {/* Financial Custody Settlement Button */}
                                  {isFin && custody.status === 'approved' && custody.settlementStatus !== 'settled' && (
                                    <button
                                      onClick={() => {
                                        setSelectedCustodyForSettlement(custody);
                                        setSettlementActualAmount(custody.amount || 0);
                                      }}
                                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-3xs"
                                    >
                                      <Receipt className="w-3 h-3" />
                                      <span>تسوية الفواتير</span>
                                    </button>
                                  )}

                                  {/* Material Custody Receipt Printable */}
                                  {!isFin && (
                                    <button
                                      onClick={() => setSelectedCustodyForReceipt(custody)}
                                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                      title="عرض وطباعة إقرار استلام العُهدة"
                                    >
                                      <Printer className="w-3 h-3 text-[#0F4C81]" />
                                      <span>إقرار QR</span>
                                    </button>
                                  )}

                                  {!isFin && custody.status === 'assigned' && (
                                    <button
                                      onClick={() => handleReturnCustody(custody.id)}
                                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                    >
                                      إرجاع
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
                </>
              )}
            </motion.div>
          )}

          {/* TAB 7: TASK ASSIGNMENT MODULE (توزيع وتتبع المهام اليومية) */}
          {activeTab === 'tasks' && (
            <motion.div
              key="tasks-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* KPIs Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white/40 backdrop-blur-md border border-white/65 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold block">إجمالي المهام المفتوحة</span>
                    <p className="text-xl font-black text-slate-800 mt-0.5">
                      {tasks.filter(t => t.status !== 'completed').length} مهام
                    </p>
                    <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full inline-block mt-2">
                      قيد التنفيذ والمتابعة
                    </span>
                  </div>
                  <div className="p-3 bg-blue-50 text-[#0F4C81] rounded-2xl">
                    <ListTodo className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-emerald-50/40 backdrop-blur-md border border-emerald-100/40 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-600 font-extrabold block">مهام تم إنجازها بنجاح</span>
                    <p className="text-xl font-black text-emerald-800 mt-0.5">
                      {tasks.filter(t => t.status === 'completed').length} مهام
                    </p>
                    <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100/50 px-2.5 py-0.5 rounded-full inline-block mt-2">
                      مغلقة ومراجعة
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-100/80 text-emerald-700 rounded-2xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-rose-50/40 backdrop-blur-md border border-rose-100/40 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-rose-600 font-extrabold block">مهام طارئة / عالية الأهمية</span>
                    <p className="text-xl font-black text-rose-800 mt-0.5">
                      {tasks.filter(t => t.priority === 'high').length} مهام
                    </p>
                    <span className="text-[9px] text-rose-700 font-bold bg-rose-100/50 px-2.5 py-0.5 rounded-full inline-block mt-2">
                      أولوية عاجلة
                    </span>
                  </div>
                  <div className="p-3 bg-rose-100/80 text-rose-700 rounded-2xl">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Action & Search Ribbon */}
              <div className="bg-white/40 backdrop-blur-md border border-white/60 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                  <div className="relative flex-1 sm:w-80">
                    <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="البحث باسم المهمة، الموظف، أو الرقم..."
                      value={taskSearch}
                      onChange={e => setTaskSearch(e.target.value)}
                      className="w-full pr-10 pl-4 py-2.5 border border-slate-200/60 bg-white/50 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setShowAddTaskModal(true)}
                  className="px-4 py-2.5 bg-[#0F4C81] text-white rounded-xl text-xs font-black hover:bg-[#0c3d67] transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>تكليف بمهمة عمل جديدة</span>
                </button>
              </div>

              {/* Task Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {tasks
                  .filter(t => t.title.toLowerCase().includes(taskSearch.toLowerCase()) || t.assignedToEmpName.toLowerCase().includes(taskSearch.toLowerCase()))
                  .map(task => (
                    <div
                      key={task.id}
                      className="bg-white/60 backdrop-blur-md border border-white/80 p-5 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between hover:scale-[1.01] transition-all"
                    >
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-black">
                            {task.taskNo}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            task.priority === 'high' ? 'bg-rose-100 text-rose-800' :
                            task.priority === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {task.priority === 'high' ? 'عالية الأهمية' : task.priority === 'medium' ? 'متوسطة' : 'عادية'}
                          </span>
                        </div>

                        <h4 className="font-black text-slate-800 text-sm mt-2">{task.title}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{task.description}</p>

                        <div className="mt-3 pt-3 border-t border-slate-200/50 space-y-1.5 text-xs text-slate-600">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">المكلف بالمهمة:</span>
                            <span className="font-black text-slate-800">{task.assignedToEmpName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">تاريخ الاستحقاق:</span>
                            <span className="font-mono font-bold text-slate-700">{task.dueDate}</span>
                          </div>
                          {task.relatedEntityName && (
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-bold">الجهة/المشروع:</span>
                              <span className="font-bold text-[#0F4C81]">{task.relatedEntityName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200/50 flex items-center justify-between">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          task.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {task.status === 'completed' ? 'تم الإنجاز بنجاح' :
                           task.status === 'in_progress' ? 'جاري التنفيذ' : 'معلقة'}
                        </span>

                        {task.status !== 'completed' && (
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>تأكيد الإنجاز</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- MODALS & FORMS (Glassmorphic panels) --- */}
      
      {/* 1. Modal for Adding Employee */}
      <AnimatePresence>
        {showAddEmpModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white/95 backdrop-blur-xl border border-white/50 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden text-right text-xs"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#0F4C81]/5">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#0F4C81]" />
                  <h3 className="font-extrabold text-sm text-slate-800">تعريف وتسجيل ملف الهوية للموظف الجديد</h3>
                </div>
                <button 
                  onClick={() => setShowAddEmpModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateEmployeeSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">الاسم الثلاثي أو الرباعي المعتمد *</label>
                    <input 
                      type="text"
                      required
                      value={newEmpName}
                      onChange={e => setNewEmpName(e.target.value)}
                      placeholder="محمود جلال عبد الرحمن"
                      className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">المسمى الوظيفي والدرجة *</label>
                    <input 
                      type="text"
                      required
                      value={newEmpRole}
                      onChange={e => setNewEmpRole(e.target.value)}
                      placeholder="سائق ونش ثقيل LR 1600"
                      className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">القسم والإدارة التابع لها *</label>
                    <select
                      value={newEmpDept}
                      onChange={e => setNewEmpDept(e.target.value)}
                      className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white text-xs font-bold focus:outline-none"
                    >
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">الرقم القومي (14 خانة) *</label>
                    <input 
                      type="text"
                      required
                      maxLength={14}
                      value={newEmpNationalId}
                      onChange={e => setNewEmpNationalId(e.target.value.replace(/\D/g, ''))}
                      placeholder="29605150102345"
                      className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white text-xs font-bold font-mono tracking-wider focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">رقم الهاتف الجوال (أورنج/فودافون) *</label>
                    <input 
                      type="text"
                      required
                      value={newEmpPhone}
                      onChange={e => setNewEmpPhone(e.target.value)}
                      placeholder="01012345678"
                      className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">البريد الإلكتروني (اختياري)</label>
                    <input 
                      type="email"
                      value={newEmpEmail}
                      onChange={e => setNewEmpEmail(e.target.value)}
                      placeholder="m.galal@egyptcranes.com"
                      className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">الراتب الأساسي التعاقدي (ج.م) *</label>
                    <input 
                      type="number"
                      required
                      value={newEmpSalary}
                      onChange={e => setNewEmpSalary(Number(e.target.value))}
                      className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">تاريخ مباشرة العمل *</label>
                    <input 
                      type="date"
                      required
                      value={newEmpHireDate}
                      onChange={e => setNewEmpHireDate(e.target.value)}
                      className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button 
                    type="button"
                    onClick={() => setShowAddEmpModal(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-all"
                  >
                    إلغاء الأمر
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-[#0F4C81] hover:bg-blue-800 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>تأكيد التسجيل والمزامنة</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Modal for Adding Leave Request */}
      <AnimatePresence>
        {showAddLeaveModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white/95 backdrop-blur-xl border border-white/50 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-right text-xs"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#0F4C81]/5">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-[#0F4C81]" />
                  <h3 className="font-extrabold text-sm text-slate-800">تقديم طلب إجازة رسمي جديد</h3>
                </div>
                <button 
                  onClick={() => setShowAddLeaveModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateLeaveSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">اختر الموظف مقدم الطلب *</label>
                  <select
                    required
                    value={newLeaveEmp}
                    onChange={e => setNewLeaveEmp(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold focus:outline-none"
                  >
                    <option value="">-- اختر الموظف --</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.name}>{e.name} ({e.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">نوع الإجازة المطلوبة *</label>
                  <select
                    value={newLeaveType}
                    onChange={e => setNewLeaveType(e.target.value as any)}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold focus:outline-none"
                  >
                    <option value="annual">إجازة سنوية اعتيادية</option>
                    <option value="sick">إجازة مرضية معتمدة</option>
                    <option value="unpaid">بدون مرتب / استثنائية</option>
                    <option value="emergency">إجازة عارضة طارئة</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">تاريخ البدء *</label>
                    <input 
                      type="date"
                      required
                      value={newLeaveStart}
                      onChange={e => setNewLeaveStart(e.target.value)}
                      className="w-full p-2.5 border rounded-xl bg-slate-50 focus:outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">تاريخ الانتهاء *</label>
                    <input 
                      type="date"
                      required
                      value={newLeaveEnd}
                      onChange={e => setNewLeaveEnd(e.target.value)}
                      className="w-full p-2.5 border rounded-xl bg-slate-50 focus:outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">مبرر الإجازة بالتفصيل *</label>
                  <textarea 
                    required
                    value={newLeaveReason}
                    onChange={e => setNewLeaveReason(e.target.value)}
                    placeholder="اكتب التبرير الإداري هنا للتوضيح..."
                    className="w-full p-2.5 border rounded-xl bg-slate-50 h-16 focus:outline-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button 
                    type="button"
                    onClick={() => setShowAddLeaveModal(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-all"
                  >
                    إلغاء الأمر
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-[#0F4C81] hover:bg-blue-800 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>تقديم الطلب للاعتماد</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Modal for Generating Payroll */}
      <AnimatePresence>
        {showGenPayrollModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white/95 backdrop-blur-xl border border-white/50 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden text-right text-xs"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#0F4C81]/5">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-[#0F4C81]" />
                  <h3 className="font-extrabold text-sm text-slate-800">إصدار وتوليد مسير الرواتب الشهري</h3>
                </div>
                <button 
                  onClick={() => setShowGenPayrollModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleGeneratePayroll} className="p-6 space-y-4">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">اختر الشهر المالي المراد رصده *</label>
                  <select
                    value={selectedPayrollMonth}
                    onChange={e => setSelectedPayrollMonth(e.target.value)}
                    className="w-full p-3 border rounded-xl bg-slate-50 font-bold focus:outline-none"
                  >
                    <option value="2026-07">يوليو 2026</option>
                    <option value="2026-08">أغسطس 2026</option>
                  </select>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                  * يقوم النظام أوتوماتيكياً باحتساب الراتب التعاقدي لكل الموظفين النشطين بالشركة، وحساب بدلات السائقين والحركة الميدانية والخصومات الأمنية آلياً وفق السجلات.
                </p>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button 
                    type="button"
                    onClick={() => setShowGenPayrollModal(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-all"
                  >
                    إلغاء الأمر
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-[#0F4C81] hover:bg-blue-800 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>توليد المسير المالي</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}

        {/* 4. Modal for Creating Loan Request */}
        {showAddLoanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white/95 backdrop-blur-xl border border-white/50 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden text-right text-xs"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#0F4C81]/5">
                <div className="flex items-center gap-2">
                  <HandCoins className="w-5 h-5 text-[#0F4C81]" />
                  <h3 className="font-extrabold text-sm text-slate-800">طلب سلفة مالية جديدة مع جدولة الخصم</h3>
                </div>
                <button
                  onClick={() => setShowAddLoanModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateLoanSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">اختر الموظف المتقدم بالطلب *</label>
                  <select
                    required
                    value={newLoanEmpId}
                    onChange={e => setNewLoanEmpId(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold focus:outline-none"
                  >
                    <option value="">-- اختر الموظف من القائمة --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">إجمالي مبلغ السلفة المطلوب (ج.م) *</label>
                    <input
                      type="number"
                      required
                      min="1000"
                      step="500"
                      value={newLoanAmount}
                      onChange={e => setNewLoanAmount(Number(e.target.value))}
                      className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">عدد الأقساط الشهرية *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="24"
                      value={newLoanInstallments}
                      onChange={e => setNewLoanInstallments(Number(e.target.value))}
                      className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600">قيمة القسط الشهري المستقطع:</span>
                  <span className="font-mono font-black text-[#0F4C81] text-sm">
                    {Math.round((newLoanAmount || 0) / (newLoanInstallments || 1)).toLocaleString('ar-EG')} ج.م / شهر
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">بداية الخصم من شهر *</label>
                    <select
                      value={newLoanStartMonth}
                      onChange={e => setNewLoanStartMonth(e.target.value)}
                      className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold focus:outline-none"
                    >
                      <option value="2026-08">أغسطس 2026</option>
                      <option value="2026-09">سبتمبر 2026</option>
                      <option value="2026-10">أكتوبر 2026</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">سبب طلب السلفة *</label>
                    <input
                      type="text"
                      required
                      placeholder="ظروف عائلية / علاج / مصاريف دراسية..."
                      value={newLoanReason}
                      onChange={e => setNewLoanReason(e.target.value)}
                      className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddLoanModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0F4C81] text-white font-extrabold rounded-xl shadow-md flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>تقديم الطلب للاعتماد</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* 5. Modal for Adding / Requesting Custody (Financial or Material) */}
        {showAddCustodyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white/95 backdrop-blur-xl border border-white/50 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden text-right text-xs"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#0F4C81]/5">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-[#0F4C81]" />
                  <h3 className="font-extrabold text-sm text-slate-800">تقديم طلب عُهدة رسمية (مالية / عينية)</h3>
                </div>
                <button
                  onClick={() => setShowAddCustodyModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Custody Type Toggle */}
              <div className="px-6 pt-4">
                <div className="grid grid-cols-2 gap-2 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setNewCustodyType('financial')}
                    className={`py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                      newCustodyType === 'financial'
                        ? 'bg-[#0F4C81] text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>عُهدة مالية / ميزانية موقع</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCustodyType('material')}
                    className={`py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                      newCustodyType === 'material'
                        ? 'bg-[#0F4C81] text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Laptop className="w-4 h-4" />
                    <span>عُهدة عينية (أجهزة / أدوات)</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateCustodySubmit} className="p-6 space-y-4">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">الموظف صاحب الطلب / المستلم *</label>
                  <select
                    required
                    value={newCustodyEmpId}
                    onChange={e => setNewCustodyEmpId(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold focus:outline-none"
                  >
                    <option value="">-- اختر الموظف --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.role}) - {emp.department}</option>
                    ))}
                  </select>
                </div>

                {/* Financial Custody Specific Form */}
                {newCustodyType === 'financial' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">المبلغ المطلوب للعُهدة (ج.م) *</label>
                        <input
                          type="number"
                          required
                          min="500"
                          step="500"
                          value={newCustodyAmount}
                          onChange={e => setNewCustodyAmount(Number(e.target.value))}
                          className="w-full p-2.5 border rounded-xl bg-slate-50 font-mono font-bold focus:outline-none text-emerald-800"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">تصنيف المصروفات *</label>
                        <select
                          value={newCustodyExpenseCat}
                          onChange={e => setNewCustodyExpenseCat(e.target.value)}
                          className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold focus:outline-none"
                        >
                          <option value="صيانة طارئة">صيانة وإصلاح طارئ بالموقع</option>
                          <option value="إعاشة ومصروفات موقع">إعاشة ومصروفات نقل وموقع</option>
                          <option value="وقود ومحروقات">وقود ومحروقات إضافية</option>
                          <option value="قطع غيار عاجلة">شراء قطع غيار ونثريات عاجلة</option>
                          <option value="رسوم وتراخيص">رسوم وتصاريح مرور وطرق</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">مركز الكلفة المرتبط (اختياري)</label>
                        <select
                          value={newCustodyCostCenterId}
                          onChange={e => setNewCustodyCostCenterId(e.target.value)}
                          className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold focus:outline-none"
                        >
                          <option value="">-- عام / بدون مركز كلفة --</option>
                          {costCenters.map(cc => (
                            <option key={cc.id} value={cc.id}>{cc.name} ({cc.code})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">التاريخ المتوقع للتسوية المستندية *</label>
                        <input
                          type="date"
                          required
                          value={newCustodyEstSettlementDate}
                          onChange={e => setNewCustodyEstSettlementDate(e.target.value)}
                          className="w-full p-2.5 border rounded-xl bg-slate-50 font-mono font-bold focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">الغرض التفصيلي وأسباب طلب العُهدة *</label>
                      <textarea
                        rows={2}
                        required
                        placeholder="شراء زيوت هيدروليك وفلاتر ونش موقع العاصمة الإدارية..."
                        value={newCustodyPurpose}
                        onChange={e => setNewCustodyPurpose(e.target.value)}
                        className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold focus:outline-none"
                      />
                    </div>

                    <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200 text-amber-900 text-[11px] font-bold space-y-1">
                      <p className="font-black text-amber-800 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>سير العمل وسلسلة الاعتمادات المالية المبرمجة:</span>
                      </p>
                      <p className="text-slate-600">
                        1. المشرف المباشر  ➔  2. مدير الموارد البشرية (HR)  ➔  3. المدير المالي (CFO)
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">اسم العُهدة / الجهاز *</label>
                        <input
                          type="text"
                          required
                          placeholder="لابتوب Dell XPS 15 / هاتف سامسونج"
                          value={newCustodyAssetName}
                          onChange={e => setNewCustodyAssetName(e.target.value)}
                          className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">فئة العُهدة *</label>
                        <select
                          value={newCustodyCategory}
                          onChange={e => setNewCustodyCategory(e.target.value as any)}
                          className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold focus:outline-none"
                        >
                          <option value="laptop">لابتوب / كمبيوتر</option>
                          <option value="mobile">هاتف / تابلت</option>
                          <option value="tools">أدوات ومعدات صيانة</option>
                          <option value="vehicle">سيارة عمل</option>
                          <option value="other">أخرى</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">الرقم التسلسلي (Serial Number) *</label>
                        <input
                          type="text"
                          required
                          placeholder="SN-9823471"
                          value={newCustodySerial}
                          onChange={e => setNewCustodySerial(e.target.value)}
                          className="w-full p-2.5 border rounded-xl bg-slate-50 font-mono font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">حالة العُهدة عند التسليم *</label>
                        <select
                          value={newCustodyCondition}
                          onChange={e => setNewCustodyCondition(e.target.value as any)}
                          className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold focus:outline-none"
                        >
                          <option value="new">جديد بالكرتونة</option>
                          <option value="good">ممتازة مستعملة</option>
                          <option value="fair">جيدة قابلة للعمل</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">ملاحظات أو شروط إضافية</label>
                      <textarea
                        rows={2}
                        placeholder="مرفق الشاحن وحقيبة اللابتوب وسماعة..."
                        value={newCustodyNotes}
                        onChange={e => setNewCustodyNotes(e.target.value)}
                        className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold focus:outline-none"
                      />
                    </div>
                  </>
                )}

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCustodyModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0F4C81] text-white font-extrabold rounded-xl shadow-md flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>{newCustodyType === 'financial' ? 'إرسال طلب العُهدة المالية للإنهاء' : 'تخصيص وتسليم العُهدة'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* 5B. Modal for Custody Approval Workflow Step */}
        {selectedCustodyForApproval && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden text-right text-xs p-6 space-y-5 border border-slate-200"
            >
              <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  <div>
                    <h3 className="text-base font-black text-slate-900">سير العمل والاعتمادات المالية للعُهدة</h3>
                    <p className="text-xs text-slate-500 font-bold">{selectedCustodyForApproval.requestNo} - {selectedCustodyForApproval.empName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustodyForApproval(null)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">البيان/الغرض:</span>
                  <span className="font-black text-slate-800">{selectedCustodyForApproval.assetName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">المبلغ المطلوب:</span>
                  <span className="font-mono font-black text-emerald-700 text-sm">{(selectedCustodyForApproval.amount || 0).toLocaleString('ar-EG')} ج.م</span>
                </div>
                {selectedCustodyForApproval.costCenterName && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">مركز الكلفة:</span>
                    <span className="font-bold text-blue-700">{selectedCustodyForApproval.costCenterName}</span>
                  </div>
                )}
              </div>

              {/* Steps Progress */}
              <div className="space-y-3">
                <p className="font-black text-slate-700">خطوات الاعتماد المالي:</p>
                {selectedCustodyForApproval.approvalWorkflow?.map((step) => {
                  const isApproved = step.status === 'approved';
                  const isRejected = step.status === 'rejected';
                  const isPending = step.status === 'pending';

                  return (
                    <div
                      key={step.stepIndex}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                        isRejected ? 'bg-rose-50 border-rose-200 text-rose-900' :
                        'bg-amber-50/60 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                          isApproved ? 'bg-emerald-600 text-white' :
                          isRejected ? 'bg-rose-600 text-white' :
                          'bg-amber-500 text-white'
                        }`}>
                          {step.stepIndex}
                        </span>
                        <div>
                          <p className="font-black">{step.role}</p>
                          {step.approverName && (
                            <p className="text-[10px] text-slate-500">المعتمد: {step.approverName} ({step.approvalDate})</p>
                          )}
                          {step.notes && <p className="text-[10px] italic text-slate-600">ملاحظة: {step.notes}</p>}
                        </div>
                      </div>

                      <div>
                        {isApproved && <span className="text-xs font-black text-emerald-700">✓ تم الاعتماد</span>}
                        {isRejected && <span className="text-xs font-black text-rose-700">✕ تم الرفض</span>}
                        {isPending && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                if (onApproveCustodyStep) {
                                  onApproveCustodyStep(
                                    selectedCustodyForApproval.id,
                                    step.stepIndex,
                                    currentUser.fullName || 'المدير المعتمد',
                                    approvalNoteInput,
                                    false
                                  );
                                }
                                setSelectedCustodyForApproval(null);
                                setApprovalNoteInput('');
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-[10px] transition-all cursor-pointer shadow-3xs"
                            >
                              موافقة
                            </button>
                            <button
                              onClick={() => {
                                if (onApproveCustodyStep) {
                                  onApproveCustodyStep(
                                    selectedCustodyForApproval.id,
                                    step.stepIndex,
                                    currentUser.fullName || 'المدير المعتمد',
                                    approvalNoteInput,
                                    true
                                  );
                                }
                                setSelectedCustodyForApproval(null);
                                setApprovalNoteInput('');
                              }}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg text-[10px] transition-all cursor-pointer shadow-3xs"
                            >
                              رفض
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">إضافة ملاحظات أو توصية الاعتماد (اختياري)</label>
                <input
                  type="text"
                  placeholder="تمت المراجعة والموافقة على الصرف..."
                  value={approvalNoteInput}
                  onChange={e => setApprovalNoteInput(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold focus:outline-none text-xs"
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 5C. Modal for Financial Custody Invoice Settlement */}
        {selectedCustodyForSettlement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-right text-xs p-6 space-y-5 border border-slate-200"
            >
              <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-purple-600" />
                  <div>
                    <h3 className="text-base font-black text-slate-900">تسوية الفواتير والمستندات المالية</h3>
                    <p className="text-xs text-slate-500 font-bold">{selectedCustodyForSettlement.requestNo}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustodyForSettlement(null)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-2 text-purple-900 font-bold">
                <div className="flex justify-between">
                  <span>المبلغ المصروف سلفاً:</span>
                  <span className="font-mono font-black text-sm">{(selectedCustodyForSettlement.amount || 0).toLocaleString('ar-EG')} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span>صاحب العُهدة:</span>
                  <span className="font-black">{selectedCustodyForSettlement.empName}</span>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (onSettleFinancialCustody) {
                    onSettleFinancialCustody(
                      selectedCustodyForSettlement.id,
                      settlementActualAmount,
                      settlementNotes
                    );
                  }
                  setSelectedCustodyForSettlement(null);
                  alert('تمت التسوية المستندية للعُهدة المالية وتحديث الحسابات بنجاح!');
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block font-bold text-slate-600 mb-1">المبلغ المصروف فعلياً حسب الفواتير (ج.م) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="50"
                    value={settlementActualAmount}
                    onChange={e => setSettlementActualAmount(Number(e.target.value))}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 font-mono font-bold text-sm text-purple-800 focus:outline-none"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border flex justify-between items-center">
                  <span className="font-bold text-slate-600">المتبقي المرتجع للخزينة:</span>
                  <span className="font-mono font-black text-emerald-700 text-sm">
                    {Math.max(0, (selectedCustodyForSettlement.amount || 0) - settlementActualAmount).toLocaleString('ar-EG')} ج.م
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">تفاصيل الفواتير والملحوظات المستندية *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="فاتورة قطع غيار رقم 841 + بيان وقود محطة وطنية..."
                    value={settlementNotes}
                    onChange={e => setSettlementNotes(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCustodyForSettlement(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-md flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>تأكيد واعتماد التسوية</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* 6. Modal for Custody Receipt Printable Document with QR Code */}
        {selectedCustodyForReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden text-right text-xs p-6 space-y-6 border border-slate-200"
            >
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">إقرار استلام عُهدة أجهزة وأدوات رسمية</h3>
                  <p className="text-xs text-slate-500 font-bold">شركة مصر للأوناش والمعدات الثقيلة (Egypt Cranes ERP)</p>
                </div>
                <button
                  onClick={() => setSelectedCustodyForReceipt(null)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 leading-relaxed text-slate-700 font-bold">
                <p>
                  أقر أنا الموظف: <span className="text-[#0F4C81] font-black">{selectedCustodyForReceipt.empName}</span> بأنني قد استلمت
                  العُهدة المبينة أدناه بحالة <span className="text-emerald-700 font-black">{selectedCustodyForReceipt.condition === 'new' ? 'جديدة' : 'ممتازة'}</span> وأتعهد بالحفاظ عليها وإرجاعها فور انتهاء الخدمة أو الطلب:
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div><span className="text-slate-400">اسم العُهدة/الجهاز:</span> <p className="font-black text-slate-900">{selectedCustodyForReceipt.assetName}</p></div>
                  <div><span className="text-slate-400">الرقم التسلسلي (S/N):</span> <p className="font-mono font-black text-slate-900">{selectedCustodyForReceipt.serialNumber}</p></div>
                  <div><span className="text-slate-400">تاريخ الاستلام:</span> <p className="font-mono text-slate-800">{selectedCustodyForReceipt.assignedDate}</p></div>
                  <div><span className="text-slate-400">حالة العُهدة:</span> <p className="text-blue-700">{selectedCustodyForReceipt.status === 'assigned' ? 'قيد الاستخدام' : 'مسترجعة'}</p></div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-100/80 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-black block">رمز التحقق البيومتري (QR Verification):</span>
                  <p className="text-[10px] text-slate-600 font-mono font-bold">CUSTODY-VERIFY-{selectedCustodyForReceipt.id}</p>
                </div>
                <div className="bg-white p-2 rounded-xl shadow-xs border">
                  <QRCodeSVG value={`https://egyptcranes.com/verify/custody/${selectedCustodyForReceipt.id}?sn=${selectedCustodyForReceipt.serialNumber}`} size={64} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-4 border-t text-center font-bold">
                <div className="space-y-8">
                  <p className="text-slate-500 text-xs">توقيع المستلم (الموظف):</p>
                  <p className="border-b border-dashed border-slate-400 pb-1 text-slate-800 font-black">{selectedCustodyForReceipt.empName}</p>
                </div>
                <div className="space-y-8">
                  <p className="text-slate-500 text-xs">اعتماد مسؤول العُهد والمخازن:</p>
                  <p className="border-b border-dashed border-slate-400 pb-1 text-[#0F4C81] font-black">إدارة الموارد البشرية</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-[#0F4C81] text-white font-extrabold rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة إقرار الاستلام والـ QR Code</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 7. Modal for Adding Task Assignment */}
        {showAddTaskModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white/95 backdrop-blur-xl border border-white/50 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden text-right text-xs"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#0F4C81]/5">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-[#0F4C81]" />
                  <h3 className="font-extrabold text-sm text-slate-800">تكليف الموظف بمهمة تشغيلية / صيانة جديدة</h3>
                </div>
                <button
                  onClick={() => setShowAddTaskModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTaskSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">عنوان المهمة الموكلة *</label>
                  <input
                    type="text"
                    required
                    placeholder="فحص صمام الهيدروليك للونش LR 1600 / صيانة دورية..."
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">وصف المهمة والتعليمات التفصيلية *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="اكتب التفاصيل والإجراءات المطلوبة اتخاذها..."
                    value={newTaskDesc}
                    onChange={e => setNewTaskDesc(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">الموظف المكلف *</label>
                    <select
                      required
                      value={newTaskEmpId}
                      onChange={e => setNewTaskEmpId(e.target.value)}
                      className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold focus:outline-none"
                    >
                      <option value="">-- اختر الموظف --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">أولوية المهمة *</label>
                    <select
                      value={newTaskPriority}
                      onChange={e => setNewTaskPriority(e.target.value as any)}
                      className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold focus:outline-none"
                    >
                      <option value="normal">عادية (Normal)</option>
                      <option value="high">عالية (High)</option>
                      <option value="urgent">عاجلة جداً (Urgent)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">تاريخ الاستحقاق والتسليم *</label>
                    <input
                      type="date"
                      required
                      value={newTaskDueDate}
                      onChange={e => setNewTaskDueDate(e.target.value)}
                      className="w-full p-2.5 border rounded-xl bg-slate-50 font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">الجهة / المشروع المرتبط</label>
                    <input
                      type="text"
                      placeholder="مشروع العاصمة الإدارية / ونش C1..."
                      value={newTaskRelatedEntity}
                      onChange={e => setNewTaskRelatedEntity(e.target.value)}
                      className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTaskModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0F4C81] text-white font-extrabold rounded-xl shadow-md flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>إسناد المهمة وإرسال الإشعار</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

