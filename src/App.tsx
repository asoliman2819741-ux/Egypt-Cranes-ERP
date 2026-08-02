import React, { useState, useEffect } from 'react';
import { 
  Crane, Vehicle, Driver, CostCenter, JournalEntry, AccountNode, 
  Invoice, Contract, MaintenanceOrder, InventoryItem, Tender, Trip, GatePass, User,
  Employee, AttendanceLog, LeaveRequest, Payroll, Role, ApprovalRequest, ApprovalAuthority,
  FixedAsset, UserMessage, EmployeeLoan, EmployeeCustody, TaskAssignment,
  LubricationSchedule, LubricationTask, SparePartsRequest, AssetMaintenanceBudget
} from './types';

import { 
  initialCranes, initialVehicles, initialDrivers, initialCostCenters, 
  initialJournalEntries, initialAccounts, initialInvoices, initialContracts, 
  initialMaintenanceOrders, initialInventoryItems, initialTenders, initialTrips, 
  initialGatePasses, initialUsers,
  initialEmployees, initialAttendance, initialLeaveRequests, initialPayrolls,
  initialRoles, initialScreens, initialApprovalRequests, initialApprovalAuthorities,
  initialFixedAssets, initialEmployeeLoans, initialCustodies, initialTasks,
  initialLubrications, initialSparePartsRequests, initialAssetBudgets
} from './mockData';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AccountsTree from './pages/AccountsTree';
import JournalEntries from './pages/JournalEntries';
import CostCenters from './pages/CostCenters';
import ProjectBudgeting from './pages/ProjectBudgeting';
import Contracts from './pages/Contracts';
import SmartInvoices from './pages/SmartInvoices';
import Tenders from './pages/Tenders';
import Costing from './pages/Costing';
import GateModule from './pages/GateModule';
import FleetAndTrips from './pages/FleetAndTrips';
import GPSTracking from './pages/GPSTracking';
import Maintenance from './pages/Maintenance';
import Inventory from './pages/Inventory';
import HRModule from './pages/HRModule';

// New Security & Approval Pages
import UsersPage from './pages/Users';
import RolesPage from './pages/Roles';
import ApprovalAuthoritiesPage from './pages/ApprovalAuthorities';
import SaveApprovalPage from './pages/SaveApproval';
import FinancialReports from './pages/FinancialReports';
import AuditLogs from './pages/AuditLogs';
import FixedAssets from './pages/FixedAssets';
import NotificationCenter from './components/NotificationCenter';
import SupabaseStatusModal from './components/SupabaseStatusModal';

// Supabase Database Sync Service
import { supabaseSyncService } from './services/supabaseSync';

// New Modules for Treasury, Checks, Partners & Messaging
import TreasuryChecks from './pages/TreasuryChecks';
import PartnersAccounts from './pages/PartnersAccounts';
import UserMessaging from './pages/UserMessaging';

// Icons
import { 
  LayoutDashboard, FolderTree, Landmark, Landmark as CostIcon, FileSignature, 
  FileSpreadsheet, Award, Scale, ShieldCheck, Truck, MapPin, 
  Wrench, Archive, LogOut, Menu, X, Bell, Calendar as CalIcon, UserCheck,
  Users as UsersIcon, Shield as ShieldIcon, FileCheck as FileCheckIcon,
  Layers, Eye, ShieldAlert, Building2, Globe, Coins, MessageSquare, Sun, Moon
} from 'lucide-react';
import { useLanguage } from './components/LanguageContext';
import { useTheme } from './components/ThemeContext';

// Define menu item mapping to screen permissions
const menuToScreenMap: Record<string, string> = {
  dashboard: 'dashboard',
  accounts: 'accounts',
  fixedAssets: 'accounts',
  journal: 'journal',
  treasury: 'journal',
  partners: 'invoices',
  messaging: 'dashboard',
  costcenters: 'accounts',
  projectBudgeting: 'accounts',
  contracts: 'contracts',
  invoices: 'invoices',
  reports: 'accounts',
  tenders: 'tenders',
  costing: 'maintenance',
  gate: 'gate',
  fleet: 'fleet',
  gps: 'fleet',
  maintenance: 'maintenance',
  inventory: 'inventory',
  hr: 'hr',
  users: 'users',
  roles: 'roles',
  approvals: 'roles',
  saveApproval: 'journal',
  auditLogs: 'users',
};

export default function App() {
  const { language, setLanguage, t, dir } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  // Load saved DB from localStorage if it exists to provide a persistent database experience
  const savedDbStr = localStorage.getItem('egypt_cranes_active_db');
  let savedDb: any = null;
  if (savedDbStr) {
    try {
      savedDb = JSON.parse(savedDbStr);
    } catch (e) {
      console.error('Failed to parse active database from localStorage', e);
    }
  }

  const defaultPermissions = {
    // Role '1' - System Admin: Full rights
    '1': initialScreens.reduce((acc, screen) => {
      acc[screen.id] = { view: true, create: true, edit: true, delete: true, print: true, export: true, import: true, approve: true };
      return acc;
    }, {} as Record<string, Record<string, boolean>>),
    
    // Role '2' - Finance Admin: Finance screens only
    '2': initialScreens.reduce((acc, screen) => {
      const isFinance = ['accounts', 'journal', 'invoices', 'contracts', 'tenders'].includes(screen.id);
      acc[screen.id] = { 
        view: isFinance, 
        create: isFinance, 
        edit: isFinance, 
        delete: false, 
        print: isFinance, 
        export: isFinance, 
        import: isFinance, 
        approve: false 
      };
      return acc;
    }, {} as Record<string, Record<string, boolean>>),

    // Role '3' - Maintenance Manager: Workshop/Fleet/Inventory
    '3': initialScreens.reduce((acc, screen) => {
      const isOps = ['maintenance', 'inventory', 'fleet'].includes(screen.id);
      acc[screen.id] = { 
        view: isOps, 
        create: isOps, 
        edit: isOps, 
        delete: false, 
        print: isOps, 
        export: isOps, 
        import: isOps, 
        approve: false 
      };
      return acc;
    }, {} as Record<string, Record<string, boolean>>),

    // Role '4' - Gate Officer: Gate passes and fleet tracking
    '4': initialScreens.reduce((acc, screen) => {
      const isGate = ['gate', 'fleet'].includes(screen.id);
      acc[screen.id] = { 
        view: isGate, 
        create: isGate, 
        edit: isGate, 
        delete: false, 
        print: isGate, 
        export: isGate, 
        import: false, 
        approve: false 
      };
      return acc;
    }, {} as Record<string, Record<string, boolean>>),

    // Role '5' - HR specialist: HR and Staffing only
    '5': initialScreens.reduce((acc, screen) => {
      const isHR = ['hr'].includes(screen.id);
      acc[screen.id] = { 
        view: isHR, 
        create: isHR, 
        edit: isHR, 
        delete: false, 
        print: isHR, 
        export: isHR, 
        import: isHR, 
        approve: false 
      };
      return acc;
    }, {} as Record<string, Record<string, boolean>>),
  };

  const [currentUser, setCurrentUser] = useState<User | null>(savedDb?.users?.[0] || initialUsers[0]); // default admin logged in
  const [page, setPage] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Global Permissions State for Role-Based Access Control
  const [permissions, setPermissions] = useState<Record<string, Record<string, Record<string, boolean>>>>(savedDb?.permissions || defaultPermissions);

  const isAllowed = (menuId: string, roleId: string) => {
    if (roleId === '1') return true; // System Admin has full access to everything!
    
    // Admin-only (Permissions & Management) screens
    const securityScreens = ['users', 'roles', 'approvals', 'auditLogs'];
    if (securityScreens.includes(menuId)) {
      return false; // strictly forbidden for anyone other than roleId '1'
    }

    if (menuId === 'dashboard') return true;

    const screenId = menuToScreenMap[menuId] || menuId;
    const rolePermissions = permissions[roleId];
    if (!rolePermissions) return false;
    const screenPerms = rolePermissions[screenId];
    if (!screenPerms) return false;
    return !!screenPerms.view;
  };

  // Global State (lifted up for full reactivity across all modules!)
  const [cranes, setCranes] = useState<Crane[]>(savedDb?.cranes || initialCranes);
  const [vehicles, setVehicles] = useState<Vehicle[]>(savedDb?.vehicles || initialVehicles);
  const [drivers, setDrivers] = useState<Driver[]>(savedDb?.drivers || initialDrivers);
  const [costCenters, setCostCenters] = useState<CostCenter[]>(savedDb?.costCenters || initialCostCenters);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(savedDb?.journalEntries || initialJournalEntries);
  const [contracts, setContracts] = useState<Contract[]>(savedDb?.contracts || initialContracts);
  const [invoices, setInvoices] = useState<Invoice[]>(savedDb?.invoices || initialInvoices);
  const [maintenanceOrders, setMaintenanceOrders] = useState<MaintenanceOrder[]>(savedDb?.maintenanceOrders || initialMaintenanceOrders);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(savedDb?.inventoryItems || initialInventoryItems);
  const [tenders, setTenders] = useState<Tender[]>(savedDb?.tenders || initialTenders);
  const [trips, setTrips] = useState<Trip[]>(savedDb?.trips || initialTrips);
  const [gatePasses, setGatePasses] = useState<GatePass[]>(savedDb?.gatePasses || initialGatePasses);
  const [fixedAssets, setFixedAssets] = useState<FixedAsset[]>(savedDb?.fixedAssets || initialFixedAssets);

  // Messages state with persistence
  const [messages, setMessages] = useState<UserMessage[]>(() => {
    const saved = localStorage.getItem('egypt_cranes_user_messages');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('egypt_cranes_user_messages', JSON.stringify(messages));
  }, [messages]);

  // Security & Approval States
  const [users, setUsers] = useState<User[]>(savedDb?.users || initialUsers);
  const [roles, setRoles] = useState<Role[]>(savedDb?.roles || initialRoles);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>(savedDb?.approvalRequests || initialApprovalRequests);
  const [approvalAuthorities, setApprovalAuthorities] = useState<ApprovalAuthority[]>(savedDb?.approvalAuthorities || initialApprovalAuthorities);

  // HR State
  const [employees, setEmployees] = useState<Employee[]>(savedDb?.employees || initialEmployees);
  const [attendance, setAttendance] = useState<AttendanceLog[]>(savedDb?.attendance || initialAttendance);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(savedDb?.leaveRequests || initialLeaveRequests);
  const [payrolls, setPayrolls] = useState<Payroll[]>(savedDb?.payrolls || initialPayrolls);
  const [loans, setLoans] = useState<EmployeeLoan[]>(savedDb?.loans || initialEmployeeLoans);
  const [custodies, setCustodies] = useState<EmployeeCustody[]>(savedDb?.custodies || initialCustodies);

  // Operations & Maintenance State
  const [tasks, setTasks] = useState<TaskAssignment[]>(savedDb?.tasks || initialTasks);
  const [lubrications, setLubrications] = useState<LubricationTask[]>(savedDb?.lubrications || initialLubrications);
  const [sparePartsRequests, setSparePartsRequests] = useState<SparePartsRequest[]>(savedDb?.sparePartsRequests || initialSparePartsRequests);
  const [assetBudgets, setAssetBudgets] = useState<AssetMaintenanceBudget[]>(savedDb?.assetBudgets || initialAssetBudgets);

  const handleAddLoan = (loan: EmployeeLoan) => {
    setLoans(prev => [loan, ...prev]);
  };

  const handleUpdateLoan = (id: string, updated: Partial<EmployeeLoan>) => {
    setLoans(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
  };

  const handleApproveLoanStep = (loanId: string, stepIndex: number, approverName: string, notes?: string, isRejected?: boolean) => {
    setLoans(prev => prev.map(l => {
      if (l.id !== loanId) return l;
      const updatedWorkflow = [...l.approvalWorkflow];
      updatedWorkflow[stepIndex] = {
        ...updatedWorkflow[stepIndex],
        status: isRejected ? 'rejected' : 'approved',
        approvedBy: approverName,
        approvalDate: new Date().toISOString().split('T')[0],
        notes: notes || updatedWorkflow[stepIndex].notes
      };

      let newStatus = l.status;
      if (isRejected) {
        newStatus = 'rejected';
      } else {
        const allApproved = updatedWorkflow.every(w => w.status === 'approved');
        if (allApproved) {
          newStatus = 'active';
        }
      }

      return {
        ...l,
        status: newStatus,
        approvalWorkflow: updatedWorkflow
      };
    }));
  };

  // Custody Handlers
  const handleAddCustody = (custody: EmployeeCustody) => {
    setCustodies(prev => [custody, ...prev]);
  };

  const handleUpdateCustody = (id: string, updated: Partial<EmployeeCustody>) => {
    setCustodies(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  };

  const handleDeleteCustody = (id: string) => {
    setCustodies(prev => prev.filter(c => c.id !== id));
  };

  // Task Handlers
  const handleAddTask = (task: TaskAssignment) => {
    setTasks(prev => [task, ...prev]);
  };

  const handleUpdateTask = (id: string, updated: Partial<TaskAssignment>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
  };

  // Lubrication Handlers
  const handleUpdateLubrication = (id: string, updated: Partial<LubricationTask>) => {
    setLubrications(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
  };

  const handleAddLubrication = (lub: LubricationTask) => {
    setLubrications(prev => [lub, ...prev]);
  };

  // Asset Maintenance Budget Handlers
  const handleUpdateAssetBudget = (id: string, updated: Partial<AssetMaintenanceBudget>) => {
    setAssetBudgets(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b));
  };

  const handleAddAssetBudget = (newBudget: AssetMaintenanceBudget) => {
    setAssetBudgets(prev => [newBudget, ...prev]);
  };

  // Spare Parts Request Handlers with Auto-Deduction from Inventory
  const handleAddSparePartsRequest = (req: SparePartsRequest) => {
    setSparePartsRequests(prev => [req, ...prev]);
  };

  const handleApproveSparePartsRequest = (requestId: string, approverName: string = 'المدير العام') => {
    const targetReq = sparePartsRequests.find(r => r.id === requestId);
    if (!targetReq) return;

    // 1. Deduct items from inventory (support both single item or items array)
    setInventoryItems(prev => prev.map(inv => {
      let qtyToDeduct = 0;
      if (targetReq.partItemId && targetReq.partItemId === inv.id) {
        qtyToDeduct += targetReq.quantityRequested || 1;
      }
      if (targetReq.items && Array.isArray(targetReq.items)) {
        const reqItem = targetReq.items.find(item => item.itemId === inv.id);
        if (reqItem) {
          qtyToDeduct += reqItem.quantity;
        }
      }
      if (qtyToDeduct > 0) {
        const currentQtyVal = inv.currentQty !== undefined ? inv.currentQty : (inv.quantity || 0);
        return { 
          ...inv, 
          currentQty: Math.max(0, currentQtyVal - qtyToDeduct),
          quantity: Math.max(0, (inv.quantity || currentQtyVal) - qtyToDeduct)
        };
      }
      return inv;
    }));

    // 2. Mark spare parts request as approved
    setSparePartsRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'approved',
          approvedBy: approverName,
          approvedDate: new Date().toISOString().split('T')[0]
        };
      }
      return r;
    }));
  };

  // Initial load: Fetch state from Supabase database to hydrate application state
  useEffect(() => {
    let isMounted = true;
    const loadFromSupabase = async () => {
      try {
        const remoteState = await supabaseSyncService.fetchFullAppState();
        if (isMounted && remoteState) {
          if (remoteState.cranes?.length) setCranes(remoteState.cranes);
          if (remoteState.maintenanceOrders?.length) setMaintenanceOrders(remoteState.maintenanceOrders);
          if (remoteState.inventoryItems?.length) setInventoryItems(remoteState.inventoryItems);
          if (remoteState.vehicles?.length) setVehicles(remoteState.vehicles);
          if (remoteState.costCenters?.length) setCostCenters(remoteState.costCenters);
          if (remoteState.invoices?.length) setInvoices(remoteState.invoices);
          if (remoteState.employees?.length) setEmployees(remoteState.employees);
          if (remoteState.tasks?.length) setTasks(remoteState.tasks);
          if (remoteState.users?.length) setUsers(remoteState.users);
          if (remoteState.roles?.length) setRoles(remoteState.roles);
          if (remoteState.drivers?.length) setDrivers(remoteState.drivers);
          if (remoteState.journalEntries?.length) setJournalEntries(remoteState.journalEntries);
          if (remoteState.contracts?.length) setContracts(remoteState.contracts);
          if (remoteState.trips?.length) setTrips(remoteState.trips);
          if (remoteState.gatePasses?.length) setGatePasses(remoteState.gatePasses);
          if (remoteState.fixedAssets?.length) setFixedAssets(remoteState.fixedAssets);
          if (remoteState.lubrications?.length) setLubrications(remoteState.lubrications);
          if (remoteState.sparePartsRequests?.length) setSparePartsRequests(remoteState.sparePartsRequests);
        }
      } catch (err) {
        console.warn('Initial Supabase fetch fallback to local storage:', err);
      }
    };
    loadFromSupabase();
    return () => { isMounted = false; };
  }, []);

  // Supabase Realtime Subscription for live multi-user/admin updates
  useEffect(() => {
    const unsubscribe = supabaseSyncService.subscribeToAllChanges(
      (remoteState) => {
        if (remoteState.cranes?.length) setCranes(remoteState.cranes);
        if (remoteState.maintenanceOrders?.length) setMaintenanceOrders(remoteState.maintenanceOrders);
        if (remoteState.inventoryItems?.length) setInventoryItems(remoteState.inventoryItems);
        if (remoteState.vehicles?.length) setVehicles(remoteState.vehicles);
        if (remoteState.costCenters?.length) setCostCenters(remoteState.costCenters);
        if (remoteState.invoices?.length) setInvoices(remoteState.invoices);
        if (remoteState.employees?.length) setEmployees(remoteState.employees);
        if (remoteState.tasks?.length) setTasks(remoteState.tasks);
        if (remoteState.users?.length) setUsers(remoteState.users);
        if (remoteState.roles?.length) setRoles(remoteState.roles);
        if (remoteState.drivers?.length) setDrivers(remoteState.drivers);
        if (remoteState.journalEntries?.length) setJournalEntries(remoteState.journalEntries);
        if (remoteState.contracts?.length) setContracts(remoteState.contracts);
        if (remoteState.trips?.length) setTrips(remoteState.trips);
        if (remoteState.gatePasses?.length) setGatePasses(remoteState.gatePasses);
        if (remoteState.fixedAssets?.length) setFixedAssets(remoteState.fixedAssets);
        if (remoteState.lubrications?.length) setLubrications(remoteState.lubrications);
        if (remoteState.sparePartsRequests?.length) setSparePartsRequests(remoteState.sparePartsRequests);
      },
      (tableName, payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const row = payload.new;
          if (!row || !row.id) return;

          if (tableName === 'cranes') {
            setCranes(prev => {
              const idx = prev.findIndex(c => c.id === row.id);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], ...row };
                return updated;
              }
              return [...prev, row];
            });
          } else if (tableName === 'maintenance_orders') {
            setMaintenanceOrders(prev => {
              const idx = prev.findIndex(m => m.id === row.id);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], ...row };
                return updated;
              }
              return [...prev, row];
            });
          } else if (tableName === 'inventory_items') {
            setInventoryItems(prev => {
              const idx = prev.findIndex(i => i.id === row.id);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], ...row };
                return updated;
              }
              return [...prev, row];
            });
          }
        } else if (payload.eventType === 'DELETE') {
          const oldRow = payload.old;
          if (!oldRow || !oldRow.id) return;

          if (tableName === 'cranes') {
            setCranes(prev => prev.filter(c => c.id !== oldRow.id));
          } else if (tableName === 'maintenance_orders') {
            setMaintenanceOrders(prev => prev.filter(m => m.id !== oldRow.id));
          } else if (tableName === 'inventory_items') {
            setInventoryItems(prev => prev.filter(i => i.id !== oldRow.id));
          }
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-sync state directly with Supabase database (and update local storage as backup)
  useEffect(() => {
    const activeDb = {
      cranes,
      vehicles,
      drivers,
      costCenters,
      journalEntries,
      contracts,
      invoices,
      maintenanceOrders,
      inventoryItems,
      tenders,
      trips,
      gatePasses,
      fixedAssets,
      users,
      roles,
      approvalRequests,
      approvalAuthorities,
      employees,
      attendance,
      leaveRequests,
      payrolls,
      loans,
      custodies,
      tasks,
      lubrications,
      sparePartsRequests,
      permissions,
      assetBudgets
    };

    // 1. Save to local storage for instant offline access / backup
    localStorage.setItem('egypt_cranes_active_db', JSON.stringify(activeDb));

    // 2. Direct Sync with Supabase Database
    const syncTimeout = setTimeout(() => {
      supabaseSyncService.syncFullAppState(activeDb as any).catch(err => {
        console.warn('Background Supabase sync error:', err);
      });
    }, 800);

    return () => clearTimeout(syncTimeout);
  }, [
    cranes, vehicles, drivers, costCenters, journalEntries, contracts,
    invoices, maintenanceOrders, inventoryItems, tenders, trips,
    gatePasses, fixedAssets, users, roles, approvalRequests,
    approvalAuthorities, employees, attendance, leaveRequests, payrolls, loans,
    custodies, tasks, lubrications, sparePartsRequests,
    permissions, assetBudgets
  ]);

  // Daily automatic backup process on initial application load
  useEffect(() => {
    const runAutoBackup = () => {
      const today = new Date().toISOString().split('T')[0];
      const lastBackupDate = localStorage.getItem('egypt_cranes_last_auto_backup_date');
      
      if (lastBackupDate !== today) {
        const activeDb = {
          cranes,
          vehicles,
          drivers,
          costCenters,
          journalEntries,
          contracts,
          invoices,
          maintenanceOrders,
          inventoryItems,
          tenders,
          trips,
          gatePasses,
          fixedAssets,
          users,
          roles,
          approvalRequests,
          approvalAuthorities,
          employees,
          attendance,
          leaveRequests,
          payrolls,
          permissions
        };
        const dbStr = JSON.stringify(activeDb);
        
        // Retrieve and append to existing backups list
        const backupsStr = localStorage.getItem('egypt_cranes_auto_backups') || '[]';
        let existingBackups = [];
        try {
          existingBackups = JSON.parse(backupsStr);
        } catch (e) {
          existingBackups = [];
        }
        
        const newBackup = {
          id: `BK-AUTO-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          type: 'auto',
          size: dbStr.length,
          database: activeDb
        };
        
        const updatedBackups = [newBackup, ...existingBackups].slice(0, 10);
        localStorage.setItem('egypt_cranes_auto_backups', JSON.stringify(updatedBackups));
        localStorage.setItem('egypt_cranes_last_auto_backup_date', today);
        
        // Append a secure audit log for the daily auto-backup
        const auditLogsStr = localStorage.getItem('egypt_cranes_audit_logs');
        let currentLogs = [];
        if (auditLogsStr) {
          try {
            currentLogs = JSON.parse(auditLogsStr);
          } catch (e) {
            currentLogs = [];
          }
        }
        
        const newBackupLog = {
          id: `LOG-BK-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          userName: 'النظام التلقائي',
          userRole: 'الخادم السحابي الآمن',
          ipAddress: '127.0.0.1 (LocalHost)',
          actionType: 'security_change',
          severity: 'info',
          module: 'المستندات والعقود',
          description: `تم إتمام عملية النسخ الاحتياطي التلقائي اليومي لقاعدة بيانات ERP بنجاح. معرف النسخة: ${newBackup.id}`,
          details: JSON.stringify({
            backup_id: newBackup.id,
            timestamp_utc: new Date().toISOString(),
            size_bytes: newBackup.size,
            auto_retention: "10_days"
          }, null, 2)
        };
        
        localStorage.setItem('egypt_cranes_audit_logs', JSON.stringify([newBackupLog, ...currentLogs]));
        console.log(`[ERP Security] Daily Auto-Backup initiated and completed successfully. ID: ${newBackup.id}`);
      }
    };
    
    // Execute daily backup after 3 seconds of page load
    const timer = setTimeout(runAutoBackup, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Event Handlers for reactive state changes
  const handleAddCrane = (newItem: Crane) => setCranes([newItem, ...cranes]);
  const handleAddVehicle = (newItem: Vehicle) => setVehicles([newItem, ...vehicles]);
  const handleAddDriver = (newItem: Driver) => setDrivers([newItem, ...drivers]);
  const handleAddCostCenter = (newItem: CostCenter) => setCostCenters([newItem, ...costCenters]);
  const handleAddJournalEntry = (newItem: JournalEntry) => setJournalEntries([newItem, ...journalEntries]);
  const handleAddContract = (newItem: Contract) => setContracts([newItem, ...contracts]);
  const handleDeleteContract = (id: string) => setContracts(contracts.filter(c => c.id !== id));
  const handleAddInvoice = (newItem: Invoice) => setInvoices([newItem, ...invoices]);
  const handleAddGatePass = (newItem: GatePass) => setGatePasses([newItem, ...gatePasses]);
  const handleAddTrip = (newItem: Trip) => setTrips([newItem, ...trips]);

  const handleAddFixedAsset = (newAsset: FixedAsset) => {
    setFixedAssets(prev => [newAsset, ...prev]);
  };

  const handleUpdateFixedAsset = (updatedAsset: FixedAsset) => {
    setFixedAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
  };

  const handleDeleteFixedAsset = (assetId: string) => {
    setFixedAssets(prev => prev.filter(a => a.id !== assetId));
  };

  // HR Handlers
  const handleAddEmployee = (newEmp: Employee) => {
    setEmployees([newEmp, ...employees]);
    if (newEmp.role.includes('سائق')) {
      const newDriver: Driver = {
        id: newEmp.id,
        name: newEmp.name,
        phone: newEmp.phone,
        licenseNumber: 'درجة أولى - لم يحدد',
        status: 'active'
      };
      setDrivers([newDriver, ...drivers]);
    }
  };

  const handleUpdateEmployee = (id: string, updatedFields: Partial<Employee>) => {
    setEmployees(employees.map(emp => emp.id === id ? { ...emp, ...updatedFields } : emp));
  };

  const handleAddAttendance = (newLog: AttendanceLog) => {
    setAttendance([newLog, ...attendance]);
  };

  const handleUpdateAttendance = (id: string, updatedFields: Partial<AttendanceLog>) => {
    setAttendance(attendance.map(log => log.id === id ? { ...log, ...updatedFields } : log));
  };

  const handleAddLeave = (newLeave: LeaveRequest) => {
    setLeaveRequests([newLeave, ...leaveRequests]);
  };

  const handleUpdateLeave = (id: string, updatedFields: Partial<LeaveRequest>) => {
    setLeaveRequests(leaveRequests.map(req => req.id === id ? { ...req, ...updatedFields } : req));
  };

  const handleAddPayroll = (newPay: Payroll) => {
    setPayrolls([newPay, ...payrolls]);
  };

  const handleUpdatePayroll = (id: string, updatedFields: Partial<Payroll>) => {
    setPayrolls(payrolls.map(pay => pay.id === id ? { ...pay, ...updatedFields } : pay));
  };

  const handleUpdateDriverStatus = (driverName: string, status: 'active' | 'on_trip' | 'vacation') => {
    setDrivers(drivers.map(d => d.name === driverName ? { ...d, status } : d));
  };

  const handleUpdateInventoryQty = (itemId: string, newQty: number) => {
    setInventoryItems(inventoryItems.map(item => 
      item.id === itemId ? { ...item, currentQty: newQty } : item
    ));
  };

  const handleAddInventoryItem = (newItem: InventoryItem) => {
    setInventoryItems([newItem, ...inventoryItems]);
  };

  const handleAddInventoryItems = (newItems: InventoryItem[]) => {
    setInventoryItems(prev => [...newItems, ...prev]);
  };

  const handleCraneMaintenanceSuccess = (craneId: string) => {
    // Release crane from maintenance state to idle
    setCranes(cranes.map(c => 
      c.id === craneId ? { ...c, status: 'idle' } : c
    ));
  };

  const handleUpdateCraneStatus = (craneId: string, status: 'running' | 'idle' | 'maintenance') => {
    setCranes(prev => prev.map(c => 
      c.id === craneId ? { ...c, status } : c
    ));
  };

  const handleApproveCustodyStep = (custodyId: string, stepIndex: number, approverName: string, notes?: string, isRejected?: boolean) => {
    setCustodies(prev => prev.map(c => {
      if (c.id !== custodyId) return c;
      const workflow = [...(c.approvalWorkflow || [])];
      const stepIdx = workflow.findIndex(s => s.stepIndex === stepIndex);
      if (stepIdx >= 0) {
        workflow[stepIdx] = {
          ...workflow[stepIdx],
          approverName,
          approvalDate: new Date().toISOString().split('T')[0],
          status: isRejected ? 'rejected' : 'approved',
          notes: notes || workflow[stepIdx].notes
        };
      } else {
        workflow.push({
          stepIndex,
          role: 'معتمد',
          approverName,
          approvalDate: new Date().toISOString().split('T')[0],
          status: isRejected ? 'rejected' : 'approved',
          notes
        });
      }
      
      const allApproved = workflow.length > 0 && workflow.every(s => s.status === 'approved');
      const anyRejected = workflow.some(s => s.status === 'rejected');
      
      let nextStatus = c.status;
      if (anyRejected) {
        nextStatus = 'rejected';
      } else if (allApproved) {
        nextStatus = c.custodyType === 'financial' ? 'approved' : 'assigned';
      } else {
        nextStatus = 'under_review';
      }

      return {
        ...c,
        approvalWorkflow: workflow,
        status: nextStatus
      };
    }));
  };

  const handleSettleFinancialCustody = (custodyId: string, settledAmount: number, notes?: string) => {
    setCustodies(prev => prev.map(c => {
      if (c.id !== custodyId) return c;
      return {
        ...c,
        settlementStatus: 'settled',
        settledAmount,
        settlementDate: new Date().toISOString().split('T')[0],
        settlementNotes: notes,
        status: 'settled'
      };
    }));
  };

  if (!currentUser) {
    return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  // Sidebar Menu Items Setup with Corporate Icons
  const menuItems = [
    { id: 'dashboard', label: t('menu_dashboard'), icon: LayoutDashboard },
    { id: 'messaging', label: t('menu_messaging'), icon: MessageSquare },
    { id: 'accounts', label: t('menu_accounts'), icon: FolderTree },
    { id: 'fixedAssets', label: t('menu_fixedAssets'), icon: Building2 },
    { id: 'journal', label: t('menu_journal'), icon: Landmark },
    { id: 'treasury', label: t('menu_treasury'), icon: Coins },
    { id: 'costcenters', label: t('menu_costcenters'), icon: CostIcon },
    { id: 'projectBudgeting', label: t('menu_projectBudgeting'), icon: FileSpreadsheet },
    { id: 'contracts', label: t('menu_contracts'), icon: FileSignature },
    { id: 'invoices', label: t('menu_invoices'), icon: FileSpreadsheet },
    { id: 'partners', label: t('menu_partners'), icon: UsersIcon },
    { id: 'reports', label: t('menu_reports'), icon: Layers },
    { id: 'tenders', label: t('menu_tenders'), icon: Award },
    { id: 'costing', label: t('menu_costing'), icon: Scale },
    { id: 'gate', label: t('menu_gate'), icon: ShieldCheck },
    { id: 'fleet', label: t('menu_fleet'), icon: Truck },
    { id: 'gps', label: t('menu_gps'), icon: MapPin },
    { id: 'maintenance', label: t('menu_maintenance'), icon: Wrench },
    { id: 'inventory', label: t('menu_inventory'), icon: Archive },
    { id: 'hr', label: t('menu_hr'), icon: UserCheck },
    { id: 'users', label: t('menu_users'), icon: UsersIcon },
    { id: 'roles', label: t('menu_roles'), icon: ShieldIcon },
    { id: 'approvals', label: t('menu_approvals'), icon: ShieldCheck },
    { id: 'saveApproval', label: t('menu_saveApproval'), icon: FileCheckIcon },
    { id: 'auditLogs', label: t('menu_auditLogs'), icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-800 dark:text-slate-100 antialiased selection:bg-[#0F4C81] selection:text-white transition-colors duration-200" dir={dir}>
      
      {/* Sidebar navigation */}
      <aside 
        className={`fixed inset-y-0 ${dir === 'rtl' ? 'right-0 border-l' : 'left-0 border-r'} z-40 w-64 bg-[#1e293b] dark:bg-slate-900 text-slate-300 transform border-slate-800 dark:border-slate-800 transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen 
            ? 'translate-x-0' 
            : (dir === 'rtl' ? 'translate-x-full' : '-translate-x-full')
        }`}
      >
        <div className="h-full flex flex-col justify-between">
          <div>
            {/* Sidebar Corporate Brand Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#F7941D] flex items-center justify-center font-black text-slate-950 text-base shadow-md shadow-orange-500/20">
                  EC
                </span>
                <div>
                  <h2 className="font-extrabold text-white text-sm tracking-wide">{t('brand_title')}</h2>
                  <p className="text-[10px] text-slate-400 font-bold">{t('brand_subtitle')}</p>
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="lg:hidden p-1 hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
              {menuItems.filter(item => isAllowed(item.id, currentUser.roleId)).map(item => {
                const IconComp = item.icon;
                const active = page === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setPage(item.id);
                      if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-extrabold rounded-xl transition-all duration-200 text-right ${
                      active 
                        ? 'bg-[#0F4C81] text-white shadow-lg shadow-blue-900/30' 
                        : 'hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <IconComp className={`w-4 h-4 ${active ? 'text-[#F7941D]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Section at bottom of Sidebar */}
          <div className="flex flex-col border-t border-slate-800 bg-slate-900/40">
            {/* Interactive User Role Switcher for Testing */}
            <div className="px-4 py-2.5 bg-[#0F4C81]/10 border-b border-slate-800">
              <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {t('sim_role_label')}
              </label>
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const selectedUser = users.find(u => u.id === e.target.value);
                  if (selectedUser) {
                    setCurrentUser(selectedUser);
                    setPage('dashboard');
                  }
                }}
                className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white rounded-lg px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#F7941D]"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.roleName})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold border border-slate-700 text-[#F7941D]">
                  {currentUser.fullName.split(' ').slice(0, 2).map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-bold text-xs text-white leading-tight">{currentUser.fullName}</p>
                  <p className="text-[9px] text-slate-400">{currentUser.jobTitle}</p>
                </div>
              </div>
              <button 
                onClick={() => setCurrentUser(null)}
                className="p-1.5 hover:bg-slate-800 text-rose-400 hover:text-red-500 rounded-lg transition-colors"
                title={t('logout_title')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main workspace container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden min-h-screen">
        
        {/* Top Navbar */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 h-16 px-6 flex items-center justify-between sticky top-0 z-30 flex-shrink-0 transition-colors">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full text-xs font-bold text-slate-500 dark:text-slate-300">
              <CalIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
              <span>{t('today_label')}: {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-xs font-black text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-sm"
              title={isDark ? (language === 'ar' ? 'التحويل للوضع الفاتح' : 'Switch to Light Mode') : (language === 'ar' ? 'التحويل للوضع الداكن' : 'Switch to Dark Mode')}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>{language === 'ar' ? 'فاتح' : 'Light'}</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{language === 'ar' ? 'داكن' : 'Dark'}</span>
                </>
              )}
            </button>

            {/* Language Switcher Button */}
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-xs font-black text-[#0F4C81] dark:text-sky-400 transition-all cursor-pointer shadow-sm"
              title={language === 'ar' ? 'Switch to English' : 'التحويل للغة العربية'}
            >
              <Globe className="w-3.5 h-3.5 text-[#F7941D]" />
              <span>{language === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            {/* Supabase DB Connection Badge */}
            <SupabaseStatusModal />

            {/* System Status Notifications */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/80 rounded-full text-[10px] font-bold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span>{t('secure_connection')}</span>
            </div>

            {/* Central Notification Center */}
            <NotificationCenter 
              currentUser={currentUser}
              approvalRequests={approvalRequests}
              onUpdateApprovalRequests={setApprovalRequests}
              leaveRequests={leaveRequests}
              onUpdateLeaveRequest={handleUpdateLeave}
              maintenanceOrders={maintenanceOrders}
              inventoryItems={inventoryItems}
              gatePasses={gatePasses}
              fixedAssets={fixedAssets}
              setPage={setPage}
            />
          </div>
        </header>

        {/* Content canvas viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 transition-colors">
          
          {!isAllowed(page, currentUser.roleId) ? (
            <div className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 animate-in fade-in duration-300">
              <div className="w-20 h-20 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 animate-bounce">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <div className="space-y-2 max-w-md">
                <h2 className="text-xl font-black text-slate-800">{t('access_denied_title')}</h2>
                <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                  {t('access_denied_desc')}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-[11px] text-slate-500 text-right w-full max-w-md space-y-1.5 font-bold" dir={dir}>
                <div className="flex justify-between border-b border-slate-100 pb-1.5 mb-1.5 text-slate-700">
                  <span>{t('digital_identity_details')}</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 rounded-lg text-slate-600 font-normal font-mono">HTTP 403 Forbidden</span>
                </div>
                <p className="flex justify-between">
                  <span>{t('current_username')}</span>
                  <span className="text-slate-700 font-black">{currentUser.fullName}</span>
                </p>
                <p className="flex justify-between">
                  <span>{t('job_role_bound')}</span>
                  <span className="text-slate-700 font-black">{currentUser.roleName}</span>
                </p>
                <p className="flex justify-between">
                  <span>{t('sub_department')}</span>
                  <span className="text-slate-700 font-medium">{currentUser.department || (language === 'ar' ? 'العمليات والتشغيل الميداني' : 'Operations & Field Services')}</span>
                </p>
                <p className="flex justify-between border-t border-slate-50 pt-1.5 mt-1.5">
                  <span>{t('access_status')}</span>
                  <span className="text-rose-600 font-black">{t('restricted_by_admin')}</span>
                </p>
              </div>
              <button
                onClick={() => setPage('dashboard')}
                className="px-5 py-2.5 bg-[#0F4C81] text-white rounded-xl font-black text-xs hover:bg-blue-800 transition-colors shadow-md shadow-blue-900/10"
              >
                {t('back_to_dashboard')}
              </button>
            </div>
          ) : (
            <>
              {page === 'dashboard' && (
                <Dashboard 
                  cranes={cranes} 
                  costCenters={costCenters} 
                  contracts={contracts} 
                  maintenanceOrders={maintenanceOrders}
                  trips={trips}
                  setPage={setPage} 
                  currentUser={currentUser}
                  setCurrentUser={setCurrentUser}
                  users={users}
                  permissions={permissions}
                />
              )}

              {page === 'messaging' && (
                <UserMessaging 
                  currentUser={currentUser}
                  messages={messages}
                  onUpdateMessages={setMessages}
                  setPage={setPage}
                />
              )}

              {page === 'treasury' && (
                <TreasuryChecks 
                  currentUser={currentUser}
                  costCenters={costCenters}
                  onUpdateCostCenters={setCostCenters}
                  onAddNotification={(msg) => {
                    const newMsg = {
                      id: `m-tr-${Date.now()}`,
                      userId: currentUser.id,
                      sender: 'إدارة الخزينة والتحصيل',
                      title: msg.title,
                      message: msg.message,
                      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                      category: msg.category,
                      isRead: false
                    };
                    setMessages(prev => [newMsg, ...prev]);
                  }}
                />
              )}

              {page === 'partners' && (
                <PartnersAccounts 
                  currentUser={currentUser}
                  onAddNotification={(msg) => {
                    const newMsg = {
                      id: `m-pt-${Date.now()}`,
                      userId: currentUser.id,
                      sender: 'الحسابات التجارية الموحدة',
                      title: msg.title,
                      message: msg.message,
                      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                      category: msg.category,
                      isRead: false
                    };
                    setMessages(prev => [newMsg, ...prev]);
                  }}
                />
              )}

              {page === 'accounts' && (
                <AccountsTree />
              )}

              {page === 'fixedAssets' && (
                <FixedAssets 
                  fixedAssets={fixedAssets}
                  costCenters={costCenters}
                  onAddFixedAsset={handleAddFixedAsset}
                  onUpdateFixedAsset={handleUpdateFixedAsset}
                  onDeleteFixedAsset={handleDeleteFixedAsset}
                />
              )}

              {page === 'journal' && (
                <JournalEntries 
                  entries={journalEntries} 
                  onAddEntry={handleAddJournalEntry} 
                  onUpdateEntries={setJournalEntries}
                  costCenters={costCenters}
                  onUpdateCostCenters={setCostCenters}
                />
              )}

              {page === 'costcenters' && (
                <CostCenters 
                  costCenters={costCenters} 
                  onAddCostCenter={handleAddCostCenter} 
                  onUpdateCostCenters={setCostCenters}
                />
              )}

              {page === 'projectBudgeting' && (
                <ProjectBudgeting 
                  costCenters={costCenters} 
                  onUpdateCostCenters={setCostCenters}
                />
              )}

              {page === 'contracts' && (
                <Contracts 
                  contracts={contracts} 
                  cranes={cranes} 
                  onAddContract={handleAddContract} 
                  onDeleteContract={handleDeleteContract}
                />
              )}

              {page === 'invoices' && (
                <SmartInvoices 
                  invoices={invoices} 
                  onAddInvoice={handleAddInvoice} 
                />
              )}

              {page === 'reports' && (
                <FinancialReports 
                  costCenters={costCenters} 
                  invoices={invoices} 
                  journalEntries={journalEntries} 
                />
              )}

              {page === 'tenders' && (
                <Tenders />
              )}

              {page === 'costing' && (
                <Costing 
                  costCenters={costCenters} 
                  cranes={cranes} 
                />
              )}

              {page === 'gate' && (
                <GateModule 
                  cranes={cranes} 
                  drivers={drivers} 
                  gatePasses={gatePasses} 
                  onAddGatePass={handleAddGatePass} 
                />
              )}

              {page === 'fleet' && (
                <FleetAndTrips 
                  cranes={cranes} 
                  vehicles={vehicles} 
                  drivers={drivers} 
                  trips={trips}
                  onAddCrane={handleAddCrane}
                  onAddVehicle={handleAddVehicle}
                  onAddDriver={handleAddDriver}
                  onAddTrip={handleAddTrip}
                />
              )}

              {page === 'gps' && (
                <GPSTracking cranes={cranes} />
              )}

              {page === 'maintenance' && (
                <Maintenance 
                  cranes={cranes} 
                  onCraneMaintenanceSuccess={handleCraneMaintenanceSuccess} 
                  onUpdateCraneStatus={handleUpdateCraneStatus}
                  lubrications={lubrications}
                  onUpdateLubrication={handleUpdateLubrication}
                  onAddLubrication={handleAddLubrication}
                  sparePartsRequests={sparePartsRequests}
                  onAddSparePartsRequest={handleAddSparePartsRequest}
                  onApproveSparePartsRequest={handleApproveSparePartsRequest}
                  inventoryItems={inventoryItems}
                  tasks={tasks}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTask}
                  assetBudgets={assetBudgets}
                  onUpdateAssetBudget={handleUpdateAssetBudget}
                  onAddAssetBudget={handleAddAssetBudget}
                />
              )}

              {page === 'inventory' && (
                <Inventory 
                  inventoryItems={inventoryItems} 
                  costCenters={costCenters}
                  onAddInventoryItem={handleAddInventoryItem}
                  onAddInventoryItems={handleAddInventoryItems}
                  onUpdateInventoryQty={handleUpdateInventoryQty}
                />
              )}

              {page === 'hr' && (
                <HRModule 
                  currentUser={currentUser}
                  employees={employees}
                  onAddEmployee={handleAddEmployee}
                  onUpdateEmployee={handleUpdateEmployee}
                  attendance={attendance}
                  onAddAttendance={handleAddAttendance}
                  onUpdateAttendance={handleUpdateAttendance}
                  leaveRequests={leaveRequests}
                  onAddLeave={handleAddLeave}
                  onUpdateLeave={handleUpdateLeave}
                  payrolls={payrolls}
                  onAddPayroll={handleAddPayroll}
                  onUpdatePayroll={handleUpdatePayroll}
                  drivers={drivers}
                  onUpdateDriverStatus={handleUpdateDriverStatus}
                  loans={loans}
                  onAddLoan={handleAddLoan}
                  onUpdateLoan={handleUpdateLoan}
                  onApproveLoanStep={handleApproveLoanStep}
                  custodies={custodies}
                  onAddCustody={handleAddCustody}
                  onUpdateCustody={handleUpdateCustody}
                  onDeleteCustody={handleDeleteCustody}
                  onApproveCustodyStep={handleApproveCustodyStep}
                  onSettleFinancialCustody={handleSettleFinancialCustody}
                  costCenters={costCenters}
                  tasks={tasks}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTask}
                />
              )}

              {page === 'users' && (
                <UsersPage 
                  users={users} 
                  onUpdateUsers={setUsers} 
                  roles={roles} 
                />
              )}

              {page === 'roles' && (
                <RolesPage 
                  roles={roles} 
                  onUpdateRoles={setRoles} 
                  screens={initialScreens} 
                  permissions={permissions}
                  onUpdatePermissions={setPermissions}
                />
              )}

              {page === 'approvals' && (
                <ApprovalAuthoritiesPage 
                  authorities={approvalAuthorities} 
                  onUpdateAuthorities={setApprovalAuthorities} 
                  users={users} 
                  screens={initialScreens} 
                />
              )}

              {page === 'saveApproval' && (
                <SaveApprovalPage 
                  requests={approvalRequests} 
                  onUpdateRequests={setApprovalRequests} 
                />
              )}

              {page === 'auditLogs' && (
                <AuditLogs 
                  currentDatabase={{
                    cranes,
                    vehicles,
                    drivers,
                    costCenters,
                    journalEntries,
                    contracts,
                    invoices,
                    maintenanceOrders,
                    inventoryItems,
                    tenders,
                    trips,
                    gatePasses,
                    fixedAssets,
                    users,
                    roles,
                    approvalRequests,
                    approvalAuthorities,
                    employees,
                    attendance,
                    leaveRequests,
                    payrolls,
                    permissions
                  }}
                  onRestoreDatabase={(newDb) => {
                    if (newDb.cranes) setCranes(newDb.cranes);
                    if (newDb.vehicles) setVehicles(newDb.vehicles);
                    if (newDb.drivers) setDrivers(newDb.drivers);
                    if (newDb.costCenters) setCostCenters(newDb.costCenters);
                    if (newDb.journalEntries) setJournalEntries(newDb.journalEntries);
                    if (newDb.contracts) setContracts(newDb.contracts);
                    if (newDb.invoices) setInvoices(newDb.invoices);
                    if (newDb.maintenanceOrders) setMaintenanceOrders(newDb.maintenanceOrders);
                    if (newDb.inventoryItems) setInventoryItems(newDb.inventoryItems);
                    if (newDb.tenders) setTenders(newDb.tenders);
                    if (newDb.trips) setTrips(newDb.trips);
                    if (newDb.gatePasses) setGatePasses(newDb.gatePasses);
                    if (newDb.fixedAssets) setFixedAssets(newDb.fixedAssets);
                    if (newDb.users) setUsers(newDb.users);
                    if (newDb.roles) setRoles(newDb.roles);
                    if (newDb.approvalRequests) setApprovalRequests(newDb.approvalRequests);
                    if (newDb.approvalAuthorities) setApprovalAuthorities(newDb.approvalAuthorities);
                    if (newDb.employees) setEmployees(newDb.employees);
                    if (newDb.attendance) setAttendance(newDb.attendance);
                    if (newDb.leaveRequests) setLeaveRequests(newDb.leaveRequests);
                    if (newDb.payrolls) setPayrolls(newDb.payrolls);
                    if (newDb.permissions) setPermissions(newDb.permissions);
                    
                    const activeDb = {
                      cranes: newDb.cranes,
                      vehicles: newDb.vehicles,
                      drivers: newDb.drivers,
                      costCenters: newDb.costCenters,
                      journalEntries: newDb.journalEntries,
                      contracts: newDb.contracts,
                      invoices: newDb.invoices,
                      maintenanceOrders: newDb.maintenanceOrders,
                      inventoryItems: newDb.inventoryItems,
                      tenders: newDb.tenders,
                      trips: newDb.trips,
                      gatePasses: newDb.gatePasses,
                      fixedAssets: newDb.fixedAssets,
                      users: newDb.users,
                      roles: newDb.roles,
                      approvalRequests: newDb.approvalRequests,
                      approvalAuthorities: newDb.approvalAuthorities,
                      employees: newDb.employees,
                      attendance: newDb.attendance,
                      leaveRequests: newDb.leaveRequests,
                      payrolls: newDb.payrolls,
                      permissions: newDb.permissions
                    };
                    localStorage.setItem('egypt_cranes_active_db', JSON.stringify(activeDb));
                  }}
                />
              )}
            </>
          )}

        </main>
      </div>

    </div>
  );
}
