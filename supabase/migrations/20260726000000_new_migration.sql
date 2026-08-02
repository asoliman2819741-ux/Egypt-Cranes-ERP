-- Migration: new-migration
-- Generated for Supabase Project thyudheynriuiqvxagnd

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Accounts Table (دليل الحسابات)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    type VARCHAR(50) NOT NULL, -- asset, liability, equity, revenue, expense
    parent_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    balance NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cost Centers Table (مراكز التكلفة)
CREATE TABLE IF NOT EXISTS cost_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    budget NUMERIC(15, 2) DEFAULT 0.00,
    allocated NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Journal Entries Table (قيود اليومية)
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- draft, posted, approved
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Journal Entry Lines (تفاصيل القيد)
CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id),
    cost_center_id UUID REFERENCES cost_centers(id),
    debit NUMERIC(15, 2) DEFAULT 0.00,
    credit NUMERIC(15, 2) DEFAULT 0.00,
    notes TEXT
);

-- Fleet Vehicles Table (أسطول المركبات)
CREATE TABLE IF NOT EXISTS fleet_vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate_number VARCHAR(50) UNIQUE NOT NULL,
    model VARCHAR(100),
    type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active', -- active, maintenance, inactive
    mileage NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Smart Invoices Table (الفواتير الذكية)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_type VARCHAR(20) DEFAULT 'sales', -- sales, purchase
    client_name VARCHAR(255) NOT NULL,
    invoice_date DATE DEFAULT CURRENT_DATE,
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    tax_amount NUMERIC(15, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'unpaid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cranes Table (الأوناش)
CREATE TABLE IF NOT EXISTS cranes (
    id TEXT PRIMARY KEY,
    code VARCHAR(50),
    name_ar TEXT,
    model VARCHAR(100),
    capacity NUMERIC(10, 2),
    status VARCHAR(50),
    operator_name TEXT,
    plate_number VARCHAR(50),
    lat NUMERIC(10, 6),
    lng NUMERIC(10, 6),
    speed NUMERIC(10, 2),
    fuel_level NUMERIC(5, 2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance Orders Table (أوامر الصيانة)
CREATE TABLE IF NOT EXISTS maintenance_orders (
    id TEXT PRIMARY KEY,
    order_no VARCHAR(50),
    crane_id TEXT,
    crane_name TEXT,
    type VARCHAR(50),
    cost NUMERIC(15, 2),
    description TEXT,
    date DATE,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory Items Table (المخزون وقطع الغيار)
CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY,
    code VARCHAR(50),
    name_ar TEXT,
    category VARCHAR(100),
    unit VARCHAR(50),
    current_qty NUMERIC(10, 2),
    min_qty NUMERIC(10, 2),
    unit_price NUMERIC(15, 2),
    warehouse_name TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App State Table (مستودع حالة النظام المباشر)
CREATE TABLE IF NOT EXISTS app_state (
    key VARCHAR(100) PRIMARY KEY,
    payload JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

