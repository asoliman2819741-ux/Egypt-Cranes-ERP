import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const dictionary: Record<Language, Record<string, string>> = {
  ar: {
    // Brand
    brand_title: 'EGYPT CRANES',
    brand_subtitle: 'بوابة الخدمات والرفع الثقيل',
    today_label: 'اليوم',
    secure_connection: 'اتصال آمن ERP • خادم مركزي سحابي',
    logout_title: 'تسجيل الخروج',
    sim_role_label: 'محاكاة دور الموظف (لتجربة الصلاحيات):',
    access_denied_title: 'عذراً، هذه الواجهة غير مصرحة لك 🛑',
    access_denied_desc: 'لقد تم تقييد وحجب هذه الشاشة بقرار من مدير النظام وفقاً للسياسات الأمنية المعتمدة لدورك الوظيفي.',
    digital_identity_details: 'تفاصيل الهوية الرقمية',
    current_username: 'اسم المستخدم الحالي:',
    job_role_bound: 'الدور الوظيفي المربوط:',
    sub_department: 'القسم التابع له:',
    access_status: 'حالة صلاحية الوصول:',
    restricted_by_admin: 'مقيدة بقرار من مدير الأنظمة والشبكات',
    back_to_dashboard: 'العودة إلى لوحة التحكم الرئيسية',

    // Menus
    menu_dashboard: 'الرئيسية والمؤشرات العامة',
    menu_accounts: 'شجرة الحسابات العامة',
    menu_fixedAssets: 'إدارة الأصول الثابتة',
    menu_journal: 'دفتر قيود اليومية',
    menu_costcenters: 'مراكز التكلفة والمشاريع',
    menu_projectBudgeting: 'موازنات وميزانيات المشاريع',
    menu_contracts: 'العقود والارتباطات',
    menu_invoices: 'الفواتير الإلكترونية الذكية',
    menu_reports: 'التقارير والقوائم المالية الموحدة',
    menu_tenders: 'دراسة وعطاءات المناقصات',
    menu_costing: 'تكاليف ومصاريف التشغيل',
    menu_gate: 'بوابة الأمن والـ QR',
    menu_fleet: 'أسطول الأوناش والنقليات',
    menu_gps: 'التتبع الحي وجغرافي الأسطول',
    menu_maintenance: 'أوامر الصيانة والتشغيل',
    menu_inventory: 'أرصدة وحركات المخازن',
    menu_hr: 'الموارد البشرية وشؤون الموظفين',
    menu_users: 'إدارة المستخدمين والمسؤولين',
    menu_roles: 'الأدوار وتراخيص الوصول',
    menu_approvals: 'صلاحيات الاعتماد والحدود',
    menu_saveApproval: 'اعتماد الحفظ وتعميد العمليات',
    menu_auditLogs: 'سجل تتبع وأمن العمليات',
    menu_treasury: 'الخزينة وحسابات الشيكات 🪙',
    menu_partners: 'العملاء والموردين وكشوف الحسابات 👤',
    menu_messaging: 'صندوق الرسائل وتنبيهات النظام ✉️',

    // Reports Tabs
    tab_pnl: 'قائمة الأرباح والخسائر',
    tab_balance: 'الميزانية العمومية',
    tab_trial: 'ميزان المراجعة',
    tab_cashflow: 'قائمة التدفقات النقدية',
    tab_ledger: 'دفتر الأستاذ المساعد',

    // Reports Screen Headers
    reports_dept: 'الإدارة المالية والمحاسبية',
    reports_title: 'مركز التقارير والقوائم المالية الموحدة',
    reports_desc: 'شاشات تحليل النشاط الائتماني والربحية، الميزانيات العمومية وتدفقات السيولة النقدية لـ Egypt Cranes',
    export_pdf: 'تصدير تقرير رسمي (PDF)',
    download_excel: 'تنزيل أوراق عمل Excel',

    // Filters
    filter_cost_center: 'مركز التكلفة / المشروع:',
    filter_year: 'السنة المالية:',
    filter_period: 'الفترة الزمنية:',
    all_cost_centers: 'كافة مراكز التكلفة والمشاريع الموحدة',
    all_periods: 'كافة الفترات السنوية المدمجة',
    period_q1: 'الربع الأول (Q1)',
    period_q2: 'الربع الثاني (Q2)',
    period_q3: 'الربع الثالث (Q3)',
    period_q4: 'الربع الرابع (Q4)',

    // KPIs / Metrics
    kpi_revenues: 'إجمالي الإيرادات المحققة',
    kpi_expenses: 'إجمالي التكاليف والمصاريف',
    kpi_net_profit: 'صافي الأرباح التشغيلية',
    kpi_roa: 'معدل العائد على الأصول (ROA)',
    kpi_liquidity: 'معدل السيولة السريعة',
    kpi_margin: 'هامش صافي الربح',
    kpi_debt_equity: 'معدل الدين إلى الملكية',
    currency_egp: 'ج.م',
    indicator_excellent: 'مؤشر ممتاز',
    indicator_monitoring: 'قيد المتابعة',
    indicator_stable: 'مستقر ومتوازن',

    // P&L
    pnl_title: 'قائمة الأرباح والخسائر والتحليلات الربحية',
    pnl_subtitle: 'تقرير الإيرادات والمصروفات وصافي الربح للفترة المحددة',
    table_col_item: 'البند المالي والتحليلي',
    table_col_val: 'القيمة المالية (ج.م)',
    table_col_pct: 'النسبة من الإيراد',
    group_revenues: 'الإيرادات التشغيلية',
    rev_crane_rental: 'إيرادات تأجير الأوناش والمعدات',
    rev_logistics: 'إيرادات نقليات وخدمات لوجستية',
    rev_maintenance: 'إيرادات صيانة وعقود خارجية',
    rev_other: 'إيرادات تشغيلية أخرى متنوعة',
    total_revenues_group: 'إجمالي الإيرادات التشغيلية',
    group_expenses: 'التكاليف والمصروفات التشغيلية',
    exp_salaries: 'أجور ورواتب المهندسين والسائقين',
    exp_fuel: 'وقود وسولار تشغيل الأوناش والمواقع',
    exp_maintenance: 'قطع غيار هيدروليكية ومصاريف صيانة',
    exp_rent: 'إيجارات واستهلاكات أصول ورش الجيزة',
    exp_insurance: 'تأمين طبي وتأمين سلامة المعدات',
    exp_marketing: 'مصاريف تسويقية وعمومية وإدارية',
    total_expenses_group: 'إجمالي التكاليف والمصروفات',
    gross_profit: 'الربح الإجمالي (قبل الضرائب)',
    tax_provision: 'مخصص الضرائب المستحقة (22.5%)',
    net_profit_period: 'صافي الربح للفترة المحددة',

    // Charts
    chart_title: 'الرسم البياني الربعي والشهري لـ Egypt Cranes',
    chart_subtitle: 'مقارنة حجم الإيرادات بالمصروفات وصافي الأرباح التراكمية',
    chart_legend_rev: 'إيرادات',
    chart_legend_exp: 'مصروفات',
    chart_legend_net: 'صافي الربح',

    // Balance Sheet
    bs_title: 'الميزانية العمومية والمركز المالي الموحد',
    bs_subtitle: 'كشف الأصول والالتزامات وحقوق الملكية للمنشأة',
    bs_assets: 'الأصول (الموجودات)',
    bs_current_assets: 'الأصول المتداولة',
    bs_cash_banks: 'نقدية بالبنوك المحلية والمصارف',
    bs_receivables: 'ذمم وحسابات عملاء تأجير الأوناش',
    bs_inventory: 'مخازن قطع الغيار والمحركات والزيوت',
    bs_total_current_assets: 'إجمالي الأصول المتداولة',
    bs_fixed_assets: 'الأصول غير المتداولة (الثابتة)',
    bs_heavy_equipment: 'أوناش ومعدات الرفع الثقيل',
    bs_vehicles: 'سيارات نقل ثقيل وجرارات ومقطورات',
    bs_buildings: 'مباني وأصول ورش ومكاتب إدارية',
    bs_total_fixed_assets: 'إجمالي الأصول غير المتداولة (الثابتة)',
    bs_total_assets: 'إجمالي الأصول',
    bs_liab_equity: 'الالتزامات وحقوق الملكية',
    bs_current_liabilities: 'الالتزامات المتداولة',
    bs_suppliers_payables: 'مستحقات الموردين وشركات الدعم',
    bs_tax_provisions: 'مخصصات ضرائب ومستحقات حكومية',
    bs_short_loans: 'قروض وتسهيلات بنكية قصيرة الأجل',
    bs_total_current_liabilities: 'إجمالي الالتزامات المتداولة',
    bs_long_liabilities: 'الالتزامات غير المتداولة',
    bs_long_loans: 'قروض طويلة الأجل من البنوك',
    bs_end_service: 'مخصص مكافأة نهاية الخدمة للموظفين',
    bs_total_long_liabilities: 'إجمالي الالتزامات غير المتداولة',
    bs_total_liabilities: 'إجمالي الالتزامات',
    bs_equity: 'حقوق الملكية (المساهمين)',
    bs_paid_capital: 'رأس المال المدفوع للمساهمين',
    bs_retained_earnings: 'أرباح مبقاة ومرحلة من سنوات سابقة',
    bs_current_earnings: 'أرباح العام المالي الحالي (قيد التوزيع)',
    bs_total_equity: 'إجمالي حقوق الملكية',
    bs_total_liab_equity: 'إجمالي الالتزامات وحقوق الملكية',

    // Trial Balance
    tb_title: 'ميزان المراجعة بالأرصدة للفترة المحددة',
    tb_subtitle: 'مطابقة وتأكيد توازن أرصدة الحسابات المدينة والدائنة',
    tb_col_code: 'كود الحساب',
    tb_col_name: 'اسم الحساب في شجرة الحسابات',
    tb_col_debit: 'أرصدة مدينة',
    tb_col_credit: 'أرصدة دائنة',
    tb_total: 'إجمالي ميزان المراجعة',
    tb_balanced_msg: 'ميزان المراجعة متوازن وبحالة ممتازة ومتطابقة',

    // Cash Flow
    cf_title: 'قائمة التدفقات النقدية والسيولة (الطريقة المباشرة)',
    cf_subtitle: 'حركة تدفق المقبوضات والمدفوعات النقدية للمنشأة للفترة',
    cf_operating: 'التدفقات النقدية من الأنشطة التشغيلية',
    cf_op_inflows: 'متحصلات نقدية من عقود تشغيل الأوناش والعملاء',
    cf_op_outflows: 'مدفوعات نقدية للموردين والمقاولين والرواتب والوقود',
    cf_op_net: 'صافي التدفق النقدي من الأنشطة التشغيلية',
    cf_investing: 'التدفقات النقدية من الأنشطة الاستثمارية',
    cf_inv_inflows: 'مبيعات خردة ومعدات خارج الخدمة مستغنى عنها',
    cf_inv_outflows: 'مدفوعات نقدية لشراء وتحديث أوناش ومعدات رفع ثقيل',
    cf_inv_net: 'صافي التدفق النقدي المستخدم في الأنشطة الاستثمارية',
    cf_financing: 'التدفقات النقدية من الأنشطة التمويلية',
    cf_fin_inflows: 'متحصلات من قروض وتسهيلات ائتمانية جديدة',
    cf_fin_outflows: 'سداد أقساط قروض وفوائد لجهات التمويل',
    cf_fin_net: 'صافي التدفق النقدي من الأنشطة التمويلية',
    cf_net_change: 'صافي الزيادة (النقص) في النقد وما يعادله للفترة',
    cf_beginning: 'رصيد النقد في بداية الفترة المالية المحددة',
    cf_ending: 'رصيد النقد في نهاية الفترة المالية المحددة',

    // General Ledger
    gl_title: 'دفتر الأستاذ المساعد وتفاصيل حركات الحساب',
    gl_subtitle: 'كشف تفصيلي بالقيود المرحلة والمقبوضات والمدفوعات لكل حساب',
    gl_select_account: 'اختر الحساب المحاسبي الرئيسي:',
    gl_start_date: 'تاريخ البدء:',
    gl_end_date: 'تاريخ الانتهاء:',
    gl_update_btn: 'تحديث الحركات',
    gl_updating: 'جاري التحديث...',
    gl_opening_bal: 'الرصيد الافتتاحي للحساب:',
    gl_ending_bal: 'الرصيد الختامي النهائي:',
    gl_total_debit: 'إجمالي المدين للفترة:',
    gl_total_credit: 'إجمالي الدائن للفترة:',
    gl_col_date: 'التاريخ',
    gl_col_doc: 'رقم السند/القيد',
    gl_col_desc: 'البيان وتفاصيل الحركة المحاسبية',
    gl_col_debit: 'مدين',
    gl_col_credit: 'دائن',
    gl_col_bal: 'الرصيد الجاري',
    gl_empty: 'لا توجد حركات محاسبية مسجلة لهذا الحساب خلال الفترة المحددة.'
  },
  en: {
    // Brand
    brand_title: 'EGYPT CRANES',
    brand_subtitle: 'Heavy Lift Services Portal',
    today_label: 'Today',
    secure_connection: 'Secure ERP Connection • Central Cloud Server',
    logout_title: 'Log Out',
    sim_role_label: 'Simulate User Role (for permission testing):',
    access_denied_title: 'Access Denied 🛑',
    access_denied_desc: 'This screen is restricted by the administrator according to your role permissions.',
    digital_identity_details: 'Digital Identity Details',
    current_username: 'Current Username:',
    job_role_bound: 'Linked Role:',
    sub_department: 'Sub-department:',
    access_status: 'Access Status:',
    restricted_by_admin: 'Restricted by Admin & Networks',
    back_to_dashboard: 'Back to Dashboard',

    // Menus
    menu_dashboard: 'Dashboard & KPIs',
    menu_accounts: 'Chart of Accounts',
    menu_fixedAssets: 'Fixed Assets Management',
    menu_journal: 'Journal Voucher Ledger',
    menu_costcenters: 'Cost Centers & Projects',
    menu_projectBudgeting: 'Project Budgeting',
    menu_contracts: 'Contracts & Obligations',
    menu_invoices: 'Smart E-Invoices',
    menu_reports: 'Consolidated Financial Reports',
    menu_tenders: 'Tenders Study & Bidding',
    menu_costing: 'Operating Costs & Expenses',
    menu_gate: 'Security Gate & QR',
    menu_fleet: 'Crane Fleet & Logistics',
    menu_gps: 'Live GPS Tracking',
    menu_maintenance: 'Maintenance & Work Orders',
    menu_inventory: 'Inventory & Stock Movements',
    menu_hr: 'Human Resources & Staff',
    menu_users: 'Users & Admins Management',
    menu_roles: 'Roles & Permissions',
    menu_approvals: 'Approval Authorities & Limits',
    menu_saveApproval: 'Operations Save Approval',
    menu_auditLogs: 'Audit & Operations Trail',
    menu_treasury: 'Treasury & Checks Portfolio',
    menu_partners: 'Customers & Suppliers Ledgers',
    menu_messaging: 'User Inbox & System Alerts',

    // Reports Tabs
    tab_pnl: 'Profit & Loss Statement',
    tab_balance: 'Balance Sheet',
    tab_trial: 'Trial Balance',
    tab_cashflow: 'Cash Flow Statement',
    tab_ledger: 'Subsidiary Ledger',

    // Reports Screen Headers
    reports_dept: 'Financial & Accounting Management',
    reports_title: 'Consolidated Financial Reports Center',
    reports_desc: 'Credit activity and profitability analysis, balance sheets and cash flow statements for Egypt Cranes',
    export_pdf: 'Export Official Report (PDF)',
    download_excel: 'Download Excel Worksheets',

    // Filters
    filter_cost_center: 'Cost Center / Project:',
    filter_year: 'Fiscal Year:',
    filter_period: 'Period:',
    all_cost_centers: 'All Consolidated Cost Centers & Projects',
    all_periods: 'All Consolidated Annual Periods',
    period_q1: 'First Quarter (Q1)',
    period_q2: 'Second Quarter (Q2)',
    period_q3: 'Third Quarter (Q3)',
    period_q4: 'Fourth Quarter (Q4)',

    // KPIs / Metrics
    kpi_revenues: 'Total Revenues Realized',
    kpi_expenses: 'Total Costs & Expenses',
    kpi_net_profit: 'Net Operating Profits',
    kpi_roa: 'Return on Assets (ROA)',
    kpi_liquidity: 'Quick Liquidity Ratio',
    kpi_margin: 'Net Profit Margin',
    kpi_debt_equity: 'Debt to Equity Ratio',
    currency_egp: 'EGP',
    indicator_excellent: 'Excellent',
    indicator_monitoring: 'Monitoring',
    indicator_stable: 'Stable & Balanced',

    // P&L
    pnl_title: 'Income Statement & Profitability Analyses',
    pnl_subtitle: 'Revenue, expenses and net profit report for the selected period',
    table_col_item: 'Financial & Analytical Item',
    table_col_val: 'Financial Value (EGP)',
    table_col_pct: 'Percentage of Revenue',
    group_revenues: 'Operating Revenues',
    rev_crane_rental: 'Crane & Equipment Rental Revenues',
    rev_logistics: 'Transportation & Logistics Revenues',
    rev_maintenance: 'External Maintenance & Contracts',
    rev_other: 'Other Miscellaneous Operating Revenues',
    total_revenues_group: 'Total Operating Revenues',
    group_expenses: 'Operating Costs & Expenses',
    exp_salaries: 'Engineers & Drivers Wages & Salaries',
    exp_fuel: 'Crane & Site Fuel & Diesel Expenses',
    exp_maintenance: 'Hydraulic Spare Parts & Maintenance',
    exp_rent: 'Giza Workshop Rental & Depreciation',
    exp_insurance: 'Medical & Equipment Safety Insurance',
    exp_marketing: 'Marketing, General & Administrative',
    total_expenses_group: 'Total Costs & Expenses',
    gross_profit: 'Gross Profit (Before Taxes)',
    tax_provision: 'Accrued Tax Provision (22.5%)',
    net_profit_period: 'Net Profit for the Selected Period',

    // Charts
    chart_title: 'Quarterly & Monthly Trend for Egypt Cranes',
    chart_subtitle: 'Comparison of revenue volume with expenses and cumulative net profits',
    chart_legend_rev: 'Revenues',
    chart_legend_exp: 'Expenses',
    chart_legend_net: 'Net Profit',

    // Balance Sheet
    bs_title: 'Balance Sheet & Consolidated Financial Position',
    bs_subtitle: 'Statement of assets, liabilities and equity',
    bs_assets: 'Assets (Existing Assets)',
    bs_current_assets: 'Current Assets',
    bs_cash_banks: 'Cash in Local Banks & Accounts',
    bs_receivables: 'Receivables & Crane Rental Accounts',
    bs_inventory: 'Spare Parts, Engines & Oil Stocks',
    bs_total_current_assets: 'Total Current Assets',
    bs_fixed_assets: 'Non-Current (Fixed) Assets',
    bs_heavy_equipment: 'Heavy Lift Cranes & Equipment',
    bs_vehicles: 'Heavy Duty Trucks, Tractors & Trailers',
    bs_buildings: 'Workshop Buildings & Administrative Assets',
    bs_total_fixed_assets: 'Total Non-Current (Fixed) Assets',
    bs_total_assets: 'Total Assets',
    bs_liab_equity: 'Liabilities & Owners Equity',
    bs_current_liabilities: 'Current Liabilities',
    bs_suppliers_payables: 'Payables to Suppliers & Support Companies',
    bs_tax_provisions: 'Tax Provisions & Government Payables',
    bs_short_loans: 'Short-Term Bank Loans & Facilities',
    bs_total_current_liabilities: 'Total Current Liabilities',
    bs_long_liabilities: 'Non-Current Liabilities',
    bs_long_loans: 'Long-Term Loans from Banks',
    bs_end_service: 'Employee End-of-Service Provision',
    bs_total_long_liabilities: 'Total Non-Current Liabilities',
    bs_total_liabilities: 'Total Liabilities',
    bs_equity: 'Equity (Shareholders)',
    bs_paid_capital: 'Paid-up Capital of Shareholders',
    bs_retained_earnings: 'Retained Earnings from Previous Years',
    bs_current_earnings: 'Current Year Earnings (Under Distribution)',
    bs_total_equity: 'Total Equity',
    bs_total_liab_equity: 'Total Liabilities & Equity',

    // Trial Balance
    tb_title: 'Trial Balance for the Selected Period',
    tb_subtitle: 'Matching and confirming the balance of debit and credit accounts',
    tb_col_code: 'Account Code',
    tb_col_name: 'Account Name in Tree',
    tb_col_debit: 'Debit Balances',
    tb_col_credit: 'Credit Balances',
    tb_total: 'Total Trial Balance',
    tb_balanced_msg: 'Trial Balance is balanced, verified, and matching!',

    // Cash Flow
    cf_title: 'Cash Flow & Liquidity Statement (Direct Method)',
    cf_subtitle: 'Statement of cash inflows and outflows for the period',
    cf_operating: 'Cash Flows from Operating Activities',
    cf_op_inflows: 'Cash receipts from crane operation contracts & clients',
    cf_op_outflows: 'Cash payments to suppliers, contractors, payroll & fuel',
    cf_op_net: 'Net Cash Flow from Operating Activities',
    cf_investing: 'Cash Flows from Investing Activities',
    cf_inv_inflows: 'Sales of scrap and decommissioned equipment',
    cf_inv_outflows: 'Cash payments to purchase & upgrade heavy cranes',
    cf_inv_net: 'Net Cash Flow from/used in Investing Activities',
    cf_financing: 'Cash Flows from Financing Activities',
    cf_fin_inflows: 'Receipts from new bank loans and facilities',
    cf_fin_outflows: 'Repayments of loan installments and interest',
    cf_fin_net: 'Net Cash Flow from Financing Activities',
    cf_net_change: 'Net Increase (Decrease) in Cash & Equivalents',
    cf_beginning: 'Cash balance at the beginning of period',
    cf_ending: 'Cash balance at the end of period',

    // General Ledger
    gl_title: 'Subsidiary Ledger & Account Transaction Details',
    gl_subtitle: 'Detailed statement of posted entries, receipts and payments for each account',
    gl_select_account: 'Select Main Ledger Account:',
    gl_start_date: 'Start Date:',
    gl_end_date: 'End Date:',
    gl_update_btn: 'Update Transactions',
    gl_updating: 'Updating...',
    gl_opening_bal: 'Opening Balance of Account:',
    gl_ending_bal: 'Final Ending Balance:',
    gl_total_debit: 'Total Debit for Period:',
    gl_total_credit: 'Total Credit for Period:',
    gl_col_date: 'Date',
    gl_col_doc: 'Voucher / Doc No',
    gl_col_desc: 'Accounting Transaction Description',
    gl_col_debit: 'Debit',
    gl_col_credit: 'Credit',
    gl_col_bal: 'Current Balance',
    gl_empty: 'No accounting transactions recorded for this account during the selected period.'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('egypt_cranes_lang');
    return (saved === 'ar' || saved === 'en') ? saved : 'ar';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('egypt_cranes_lang', lang);
  };

  const t = (key: string): string => {
    return dictionary[language]?.[key] || dictionary['ar']?.[key] || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [dir, language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
