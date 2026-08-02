-- Migration: 20260728000000_core_tables_rls.sql
-- Description: Create core tables (users, cranes, maintenance_orders, inventory_items, tasks) with FK relationships, timestamps, and RLS policies for multi-user access.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (المستخدمين والكوادر)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'operator',
    department VARCHAR(100) DEFAULT 'إدارة التشغيل والصيانة',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Cranes Table (سجل الأوناش والمعدات الثقيلة)
CREATE TABLE IF NOT EXISTS cranes (
    id TEXT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name_ar TEXT NOT NULL,
    model VARCHAR(100),
    capacity NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'idle', -- running, idle, maintenance, offline
    operator_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    operator_name TEXT,
    plate_number VARCHAR(50),
    location TEXT,
    lat NUMERIC(10, 6),
    lng NUMERIC(10, 6),
    speed NUMERIC(10, 2) DEFAULT 0.00,
    fuel_level NUMERIC(5, 2) DEFAULT 100.00,
    working_hours NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Maintenance Orders Table (أوامر الصيانة والإصلاح)
CREATE TABLE IF NOT EXISTS maintenance_orders (
    id TEXT PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    crane_id TEXT REFERENCES cranes(id) ON DELETE CASCADE,
    crane_name TEXT,
    type VARCHAR(50) NOT NULL, -- periodic, breakdown, emergency, preventative
    cost NUMERIC(15, 2) DEFAULT 0.00,
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
    technician_name TEXT,
    status VARCHAR(50) DEFAULT 'open', -- open, in_progress, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Inventory Items Table (المخزون وقطع الغيار)
CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    category VARCHAR(100) DEFAULT 'قطع غيار أوناش',
    unit VARCHAR(50) DEFAULT 'قطعة',
    current_qty NUMERIC(10, 2) DEFAULT 0.00,
    min_qty NUMERIC(10, 2) DEFAULT 0.00,
    unit_price NUMERIC(15, 2) DEFAULT 0.00,
    warehouse_name TEXT DEFAULT 'المخزن الرئيسي - 6 أكتوبر',
    location_rack VARCHAR(50),
    status VARCHAR(50) DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tasks Table (المهام التشغيلية والميدانية)
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    crane_id TEXT REFERENCES cranes(id) ON DELETE SET NULL,
    assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
    assigned_name TEXT,
    priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high, urgent
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, delayed
    start_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

--------------------------------------------------------------------------------
-- INDEXES FOR OPTIMIZED PERFORMANCE
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cranes_status ON cranes(status);
CREATE INDEX IF NOT EXISTS idx_cranes_operator ON cranes(operator_id);
CREATE INDEX IF NOT EXISTS idx_maint_crane_id ON maintenance_orders(crane_id);
CREATE INDEX IF NOT EXISTS idx_maint_status ON maintenance_orders(status);
CREATE INDEX IF NOT EXISTS idx_inventory_code ON inventory_items(code);
CREATE INDEX IF NOT EXISTS idx_tasks_crane_id ON tasks(crane_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);

--------------------------------------------------------------------------------
-- AUTOMATIC UPDATED_AT TRIGGER FUNCTION
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER update_cranes_modtime BEFORE UPDATE ON cranes FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER update_maint_modtime BEFORE UPDATE ON maintenance_orders FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER update_inventory_modtime BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

--------------------------------------------------------------------------------
-- ROW-LEVEL SECURITY (RLS) POLICIES FOR MULTI-USER ACCESS
--------------------------------------------------------------------------------

-- Enable RLS on all 5 tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cranes ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 1. Users RLS Policies
CREATE POLICY "Allow public select on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert/update on users" ON users FOR ALL USING (true);

-- 2. Cranes RLS Policies
CREATE POLICY "Allow public select on cranes" ON cranes FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert/update/delete on cranes" ON cranes FOR ALL USING (true);

-- 3. Maintenance Orders RLS Policies
CREATE POLICY "Allow public select on maintenance_orders" ON maintenance_orders FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert/update/delete on maintenance_orders" ON maintenance_orders FOR ALL USING (true);

-- 4. Inventory Items RLS Policies
CREATE POLICY "Allow public select on inventory_items" ON inventory_items FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert/update/delete on inventory_items" ON inventory_items FOR ALL USING (true);

-- 5. Tasks RLS Policies
CREATE POLICY "Allow public select on tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert/update/delete on tasks" ON tasks FOR ALL USING (true);
