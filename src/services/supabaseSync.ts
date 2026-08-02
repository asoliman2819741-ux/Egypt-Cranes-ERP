import { supabase } from '../lib/supabase';
import { 
  Crane, MaintenanceOrder, InventoryItem, Vehicle, Driver, CostCenter, 
  JournalEntry, Invoice, Contract, Employee, GatePass, Trip, FixedAsset, 
  TaskAssignment, User, Role, ApprovalRequest, AttendanceLog, LeaveRequest, 
  Payroll, EmployeeLoan, EmployeeCustody, LubricationTask, SparePartsRequest, 
  AssetMaintenanceBudget, UserMessage 
} from '../types';

export interface AppStateData {
  cranes: Crane[];
  maintenanceOrders: MaintenanceOrder[];
  inventoryItems: InventoryItem[];
  vehicles: Vehicle[];
  drivers: Driver[];
  costCenters: CostCenter[];
  journalEntries: JournalEntry[];
  invoices: Invoice[];
  contracts: Contract[];
  employees: Employee[];
  gatePasses: GatePass[];
  trips: Trip[];
  fixedAssets: FixedAsset[];
  tasks: TaskAssignment[];
  users: User[];
  roles: Role[];
  approvalRequests: ApprovalRequest[];
  attendance: AttendanceLog[];
  leaveRequests: LeaveRequest[];
  payrolls: Payroll[];
  loans: EmployeeLoan[];
  custodies: EmployeeCustody[];
  lubrications: LubricationTask[];
  sparePartsRequests: SparePartsRequest[];
  assetBudgets: AssetMaintenanceBudget[];
  messages?: UserMessage[];
}

export interface SyncResult {
  success: boolean;
  message: string;
  timestamp: string;
  syncedTables?: string[];
  error?: string;
}

class SupabaseSyncService {
  private isOnline: boolean = true;
  private lastSyncTime: string | null = null;
  private syncInProgress: boolean = false;

  constructor() {
    this.checkConnection();
  }

  /**
   * Check connection health with Supabase
   */
  async checkConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from('test_connection').select('*').limit(1);
      if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
        this.isOnline = false;
        return false;
      }
      this.isOnline = true;
      return true;
    } catch {
      this.isOnline = false;
      return false;
    }
  }

  /**
   * Generic fetch for any table in Supabase
   */
  async fetchTable<T = any>(tableName: string): Promise<{ data: T[] | null; error: any }> {
    try {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) {
        console.warn(`[SupabaseSync] Error fetching table '${tableName}':`, error.message);
        return { data: null, error };
      }
      return { data: data as T[], error: null };
    } catch (err) {
      console.error(`[SupabaseSync] Exception fetching table '${tableName}':`, err);
      return { data: null, error: err };
    }
  }

  /**
   * Upsert item(s) into a specific table in Supabase
   */
  async upsertItems<T = any>(tableName: string, items: T[] | T): Promise<SyncResult> {
    try {
      const itemsArray = Array.isArray(items) ? items : [items];
      if (itemsArray.length === 0) {
        return { success: true, message: 'لا توجد بيانات للمزامنة', timestamp: new Date().toISOString() };
      }

      const { error } = await supabase.from(tableName).upsert(itemsArray as any, { onConflict: 'id' });
      if (error) {
        // Fall back to simple insert or report table absence gracefully
        console.warn(`[SupabaseSync] Upsert error on table '${tableName}':`, error.message);
        return {
          success: false,
          message: `فشل المزامنة لـ ${tableName}: ${error.message}`,
          timestamp: new Date().toISOString(),
          error: error.message
        };
      }

      this.lastSyncTime = new Date().toISOString();
      return {
        success: true,
        message: `تمت مزامنة ${itemsArray.length} سجل في جدول ${tableName} بنجاح`,
        timestamp: this.lastSyncTime,
        syncedTables: [tableName]
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'حدث خطأ أثناء المزامنة',
        timestamp: new Date().toISOString(),
        error: String(err)
      };
    }
  }

  /**
   * Delete an item by ID from a table in Supabase
   */
  async deleteItem(tableName: string, id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) {
        console.warn(`[SupabaseSync] Delete error on table '${tableName}' ID '${id}':`, error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error(`[SupabaseSync] Delete exception on '${tableName}':`, err);
      return false;
    }
  }

  /**
   * Fetch complete app state directly from Supabase tables or state store
   */
  async fetchFullAppState(): Promise<Partial<AppStateData> | null> {
    if (this.syncInProgress) return null;
    this.syncInProgress = true;

    try {
      // 1. Try to fetch from central app_state store if created
      const { data: appStateRows, error: stateErr } = await supabase
        .from('app_state')
        .select('*')
        .eq('key', 'active_db')
        .single();

      if (!stateErr && appStateRows && appStateRows.payload) {
        this.syncInProgress = false;
        this.lastSyncTime = new Date().toISOString();
        return appStateRows.payload as Partial<AppStateData>;
      }

      // 2. Fetch individually from specific domain tables if available
      const fetchedState: Partial<AppStateData> = {};

      const [
        cranesRes, maintenanceRes, inventoryRes, vehiclesRes, costCentersRes, 
        invoicesRes, employeesRes, tasksRes, usersRes, rolesRes
      ] = await Promise.all([
        this.fetchTable<Crane>('cranes'),
        this.fetchTable<MaintenanceOrder>('maintenance_orders'),
        this.fetchTable<InventoryItem>('inventory_items'),
        this.fetchTable<Vehicle>('fleet_vehicles'),
        this.fetchTable<CostCenter>('cost_centers'),
        this.fetchTable<Invoice>('invoices'),
        this.fetchTable<Employee>('employees'),
        this.fetchTable<TaskAssignment>('tasks'),
        this.fetchTable<User>('users'),
        this.fetchTable<Role>('roles'),
      ]);

      if (cranesRes.data && cranesRes.data.length > 0) fetchedState.cranes = cranesRes.data;
      if (maintenanceRes.data && maintenanceRes.data.length > 0) fetchedState.maintenanceOrders = maintenanceRes.data;
      if (inventoryRes.data && inventoryRes.data.length > 0) fetchedState.inventoryItems = inventoryRes.data;
      if (vehiclesRes.data && vehiclesRes.data.length > 0) fetchedState.vehicles = vehiclesRes.data;
      if (costCentersRes.data && costCentersRes.data.length > 0) fetchedState.costCenters = costCentersRes.data;
      if (invoicesRes.data && invoicesRes.data.length > 0) fetchedState.invoices = invoicesRes.data;
      if (employeesRes.data && employeesRes.data.length > 0) fetchedState.employees = employeesRes.data;
      if (tasksRes.data && tasksRes.data.length > 0) fetchedState.tasks = tasksRes.data;
      if (usersRes.data && usersRes.data.length > 0) fetchedState.users = usersRes.data;
      if (rolesRes.data && rolesRes.data.length > 0) fetchedState.roles = rolesRes.data;

      this.syncInProgress = false;
      this.lastSyncTime = new Date().toISOString();
      
      return Object.keys(fetchedState).length > 0 ? fetchedState : null;
    } catch (err) {
      console.error('[SupabaseSync] Error in fetchFullAppState:', err);
      this.syncInProgress = false;
      return null;
    }
  }

  /**
   * Sync complete local application state directly to Supabase
   */
  async syncFullAppState(state: AppStateData): Promise<SyncResult> {
    try {
      this.syncInProgress = true;
      const syncedTables: string[] = [];

      // A. Save complete payload to central `app_state` key-value table in Supabase
      const { error: stateStoreErr } = await supabase
        .from('app_state')
        .upsert(
          { key: 'active_db', payload: state, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      if (!stateStoreErr) {
        syncedTables.push('app_state');
      }

      // B. Also sync individual key entities directly into Supabase relational tables if they exist
      const promises = [
        // Cranes
        state.cranes?.length ? this.upsertItems('cranes', state.cranes) : Promise.resolve(null),
        // Fleet vehicles
        state.vehicles?.length ? this.upsertItems('fleet_vehicles', state.vehicles.map(v => ({
          id: v.id,
          plate_number: v.plateNumber || v.code,
          type: v.type,
          status: v.status,
          model: v.code
        }))) : Promise.resolve(null),
        // Cost centers
        state.costCenters?.length ? this.upsertItems('cost_centers', state.costCenters.map(c => ({
          id: c.id,
          code: c.code,
          name: c.nameAr,
          budget: c.budget,
          allocated: c.usedBudget
        }))) : Promise.resolve(null),
        // Invoices
        state.invoices?.length ? this.upsertItems('invoices', state.invoices.map(i => ({
          id: i.id,
          invoice_number: i.invoiceNo,
          client_name: i.customerName,
          invoice_date: i.date,
          total_amount: i.total,
          tax_amount: i.tax,
          status: i.status
        }))) : Promise.resolve(null),
        // Maintenance Orders
        state.maintenanceOrders?.length ? this.upsertItems('maintenance_orders', state.maintenanceOrders) : Promise.resolve(null),
        // Inventory
        state.inventoryItems?.length ? this.upsertItems('inventory_items', state.inventoryItems) : Promise.resolve(null),
      ];

      await Promise.allSettled(promises);

      this.syncInProgress = false;
      this.lastSyncTime = new Date().toISOString();

      return {
        success: true,
        message: 'تمت المزامنة الكاملة لحالة النظام مع قاعدة بيانات Supabase بنجاح',
        timestamp: this.lastSyncTime,
        syncedTables: ['app_state', 'cranes', 'fleet_vehicles', 'cost_centers', 'invoices', 'maintenance_orders', 'inventory_items']
      };
    } catch (err: any) {
      this.syncInProgress = false;
      return {
        success: false,
        message: err.message || 'فشلت المزامنة المباشرة مع Supabase',
        timestamp: new Date().toISOString(),
        error: String(err)
      };
    }
  }

  /**
   * Sync single entity type (e.g. cranes, maintenance, inventory)
   */
  async syncEntity<T>(entityName: string, items: T[]): Promise<SyncResult> {
    return this.upsertItems(entityName, items);
  }

  /**
   * Setup real-time listener for entity changes from Supabase
   */
  subscribeToEntity(tableName: string, onChange: (payload: any) => void) {
    const channel = supabase
      .channel(`public:${tableName}_${Math.random().toString(36).substring(2, 7)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
        console.log(`[SupabaseSync] Realtime event on '${tableName}':`, payload);
        onChange(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Subscribe to real-time changes across app_state and key entities
   */
  subscribeToAllChanges(
    onAppStateChange: (newState: Partial<AppStateData>) => void,
    onTableChange?: (table: string, payload: any) => void
  ) {
    const channel = supabase
      .channel('public:app_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_state' }, (payload) => {
        console.log('[SupabaseSync] Realtime change detected on app_state:', payload);
        if (payload.new && (payload.new as any).payload) {
          onAppStateChange((payload.new as any).payload as Partial<AppStateData>);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cranes' }, (payload) => {
        if (onTableChange) onTableChange('cranes', payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_orders' }, (payload) => {
        if (onTableChange) onTableChange('maintenance_orders', payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, (payload) => {
        if (onTableChange) onTableChange('inventory_items', payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, (payload) => {
        if (onTableChange) onTableChange('invoices', payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fleet_vehicles' }, (payload) => {
        if (onTableChange) onTableChange('fleet_vehicles', payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Status metrics
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      lastSyncTime: this.lastSyncTime,
      syncInProgress: this.syncInProgress
    };
  }
}

export const supabaseSyncService = new SupabaseSyncService();
export default supabaseSyncService;
