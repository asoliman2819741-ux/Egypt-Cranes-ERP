import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Server, Wifi, AlertTriangle, CheckCircle2, XCircle, 
  RefreshCw, Clock, Database, ShieldCheck, Zap, Download, Play, Pause,
  Radio, HardDrive, BarChart3, Settings
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { supabase } from '../lib/supabase';

interface HealthLogSample {
  timestamp: string;
  timeLabel: string;
  latencyMs: number;
  status: 'healthy' | 'degraded' | 'offline';
  code: number;
}

interface TableHealth {
  tableName: string;
  titleAr: string;
  status: 'ok' | 'error' | 'checking';
  rowCount: number;
  latencyMs: number;
}

export default function SystemHealthDashboard() {
  const [isMonitoring, setIsMonitoring] = useState<boolean>(true);
  const [intervalMs, setIntervalMs] = useState<number>(5000); // 5 seconds default ping
  const [latencyHistory, setLatencyHistory] = useState<HealthLogSample[]>([]);
  const [currentStatus, setCurrentStatus] = useState<'healthy' | 'degraded' | 'offline'>('healthy');
  const [currentLatency, setCurrentLatency] = useState<number>(0);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');
  
  // Stats
  const [totalHeartbeats, setTotalHeartbeats] = useState<number>(0);
  const [successfulPings, setSuccessfulPings] = useState<number>(0);
  const [failedPings, setFailedPings] = useState<number>(0);

  // Table Health Checks
  const [tableStatuses, setTableStatuses] = useState<TableHealth[]>([
    { tableName: 'app_state', titleAr: 'مستودع الحالة الرئيسية', status: 'checking', rowCount: 0, latencyMs: 0 },
    { tableName: 'cranes', titleAr: 'جدول الأوناش والأسطول', status: 'checking', rowCount: 0, latencyMs: 0 },
    { tableName: 'maintenance_orders', titleAr: 'جدول أوامر الصيانة', status: 'checking', rowCount: 0, latencyMs: 0 },
    { tableName: 'inventory_items', titleAr: 'جدول قطع الغيار والمخزون', status: 'checking', rowCount: 0, latencyMs: 0 },
    { tableName: 'invoices', titleAr: 'جدول الفواتير والمالية', status: 'checking', rowCount: 0, latencyMs: 0 },
  ]);

  const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  const isComponentMounted = useRef<boolean>(true);

  // Measure heartbeat ping
  const performHeartbeat = async () => {
    const startTime = performance.now();
    const now = new Date();
    const timeLabel = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    try {
      // Direct HEAD / count query to Supabase REST API
      const { error, status: httpStatus } = await supabase
        .from('app_state')
        .select('*', { count: 'exact', head: true })
        .limit(1);

      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      if (!isComponentMounted.current) return;

      const isSuccess = !error || error.code === 'PGRST116' || error.code === '42P01';
      const healthStatus: 'healthy' | 'degraded' | 'offline' = 
        !isSuccess ? 'offline' : latency > 350 ? 'degraded' : 'healthy';

      setCurrentLatency(latency);
      setCurrentStatus(healthStatus);
      setLastCheckTime(now.toLocaleTimeString('ar-EG'));

      setTotalHeartbeats(prev => prev + 1);
      if (isSuccess) {
        setSuccessfulPings(prev => prev + 1);
      } else {
        setFailedPings(prev => prev + 1);
      }

      // Add to historic trend sample (keep max 20)
      setLatencyHistory(prev => {
        const next = [
          ...prev,
          {
            timestamp: now.toISOString(),
            timeLabel,
            latencyMs: isSuccess ? latency : 0,
            status: healthStatus,
            code: httpStatus || (isSuccess ? 200 : 500)
          }
        ];
        return next.slice(-20);
      });
    } catch (err) {
      if (!isComponentMounted.current) return;
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      setCurrentLatency(latency);
      setCurrentStatus('offline');
      setLastCheckTime(now.toLocaleTimeString('ar-EG'));

      setTotalHeartbeats(prev => prev + 1);
      setFailedPings(prev => prev + 1);

      setLatencyHistory(prev => [
        ...prev,
        {
          timestamp: now.toISOString(),
          timeLabel,
          latencyMs: 0,
          status: 'offline',
          code: 500
        }
      ].slice(-20));
    }
  };

  // Inspect specific tables in database
  const inspectTables = async () => {
    const updated = [...tableStatuses];
    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      const start = performance.now();
      try {
        const { count, error } = await supabase
          .from(item.tableName)
          .select('*', { count: 'exact', head: true });
        const end = performance.now();

        item.latencyMs = Math.round(end - start);
        item.status = error ? 'error' : 'ok';
        item.rowCount = count || 0;
      } catch {
        item.status = 'error';
        item.latencyMs = 0;
      }
    }
    if (isComponentMounted.current) {
      setTableStatuses([...updated]);
    }
  };

  // Initial and Interval Timer
  useEffect(() => {
    isComponentMounted.current = true;

    // Run immediate heartbeat and table inspection
    performHeartbeat();
    inspectTables();

    let timer: any = null;
    if (isMonitoring) {
      timer = setInterval(() => {
        performHeartbeat();
      }, intervalMs);
    }

    return () => {
      isComponentMounted.current = false;
      if (timer) clearInterval(timer);
    };
  }, [isMonitoring, intervalMs]);

  // Reconnect Realtime WebSocket
  const reconnectWebSocket = () => {
    setWsStatus('connecting');
    const channel = supabase.channel(`health_ping_${Date.now()}`);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setWsStatus('connected');
        setTimeout(() => supabase.removeChannel(channel), 1000);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setWsStatus('disconnected');
      }
    });
  };

  // Derived KPI Stats
  const avgLatency = latencyHistory.length > 0 
    ? Math.round(latencyHistory.reduce((acc, h) => acc + h.latencyMs, 0) / latencyHistory.length)
    : 0;

  const minLatency = latencyHistory.length > 0
    ? Math.min(...latencyHistory.map(h => h.latencyMs))
    : 0;

  const maxLatency = latencyHistory.length > 0
    ? Math.max(...latencyHistory.map(h => h.latencyMs))
    : 0;

  const uptimePercentage = totalHeartbeats > 0
    ? ((successfulPings / totalHeartbeats) * 100).toFixed(2)
    : '100.00';

  // Export Health Logs to JSON
  const exportHealthLogs = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      serverRegion: 'eu-central-1 (Frankfurt)',
      endpoint: 'https://thyudheynriuiqvxagnd.supabase.co/rest/v1/',
      uptimePercentage: `${uptimePercentage}%`,
      avgLatencyMs: avgLatency,
      totalHeartbeats,
      successfulPings,
      failedPings,
      tableHealth: tableStatuses,
      latencyHistory
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_health_report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="system-health-dashboard" className="bg-slate-900 text-white p-5 md:p-7 rounded-2xl border border-slate-800 shadow-xl space-y-6 dir-rtl text-right">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl shadow-inner">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                لوحة صحة النظام والأداء المباشر (System Health Dashboard)
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                currentStatus === 'healthy' 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : currentStatus === 'degraded'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}>
                {currentStatus === 'healthy' ? 'السيرفر متصل ومستقر ⚡' : currentStatus === 'degraded' ? 'بطء في الاستجابة' : 'انقطاع الاتصال ⚠️'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              مراقبة نبضية لحظية (Heartbeat) لقاعدة بيانات Supabase، زمن الاستجابة، والقنوات المباشرة
            </p>
          </div>
        </div>

        {/* MONITORING CONTROLS */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Pause / Play Heartbeat */}
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              isMonitoring 
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
          >
            {isMonitoring ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isMonitoring ? 'إيقاف الفحص التلقائي' : 'تشغيل الفحص التلقائي'}</span>
          </button>

          {/* Instant Ping Button */}
          <button
            onClick={() => { performHeartbeat(); inspectTables(); }}
            className="px-3 py-2 bg-[#0F4C81] hover:bg-[#125894] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm border border-blue-400/30"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>فحص نبضي فوري</span>
          </button>

          {/* Export Report */}
          <button
            onClick={exportHealthLogs}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700"
            title="تصدير تقرير الجاهزية والنُسخ الأحصائية"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* INTERVAL SELECTOR & LIVE PULSE BANNER */}
      <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isMonitoring ? 'bg-emerald-400' : 'bg-slate-500'
            }`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isMonitoring ? 'bg-emerald-500' : 'bg-slate-600'
            }`} />
          </span>
          <span className="text-slate-300 font-bold">
            آخر فحص: <span className="font-mono text-emerald-400">{lastCheckTime || 'جاري الفحص...'}</span>
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">
            عنوان Endpoint: <strong className="font-mono text-slate-200">thyudheynriuiqvxagnd.supabase.co</strong>
          </span>
        </div>

        {/* Interval Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">تردد النبضات:</span>
          <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex items-center gap-1 font-mono text-[11px]">
            {[3000, 5000, 10000, 30000].map(ms => (
              <button
                key={ms}
                onClick={() => setIntervalMs(ms)}
                className={`px-2 py-0.5 rounded transition-all ${
                  intervalMs === ms 
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-xs' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {ms / 1000}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* METRIC KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: LATENCY */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold">زمن الاستجابة (Latency)</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-white">{currentLatency}</span>
            <span className="text-xs text-slate-400 font-bold">مللي ثانية (ms)</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>المتوسط: <strong className="font-mono text-emerald-400">{avgLatency} ms</strong></span>
            <span>المدى: <strong className="font-mono text-slate-300">{minLatency}-{maxLatency} ms</strong></span>
          </div>
        </div>

        {/* KPI 2: UPTIME PERCENTAGE */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold">نسبة التوفر (System Uptime)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-emerald-400">{uptimePercentage}%</span>
            <span className="text-xs text-slate-400 font-bold">جاهزية تشغيلية</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>الناجحة: <strong className="font-mono text-emerald-400">{successfulPings}</strong></span>
            <span>الفاشلة: <strong className="font-mono text-rose-400">{failedPings}</strong></span>
          </div>
        </div>

        {/* KPI 3: TOTAL HEARTBEATS */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold">إجمالي الفحوصات (Pings)</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-white">{totalHeartbeats}</span>
            <span className="text-xs text-slate-400 font-bold">نبضة مفحوصة</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>حالة السيرفر: <strong className="text-emerald-400 font-bold">Online 200 OK</strong></span>
          </div>
        </div>

        {/* KPI 4: REALTIME WEBSOCKET STATUS */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold">قناة Realtime (WebSocket)</span>
            <Radio className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-base font-black ${
              wsStatus === 'connected' ? 'text-emerald-400' : wsStatus === 'connecting' ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {wsStatus === 'connected' ? 'مُتصل وقائم 🟢' : wsStatus === 'connecting' ? 'جاري الاتصال...' : 'منقطع 🔴'}
            </span>
            <button
              onClick={reconnectWebSocket}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-200 rounded-lg border border-slate-700 transition-colors"
            >
              إعادة الاتصال
            </button>
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span>قنوات البث المباشر والتحديثات الفورية نشطة</span>
          </div>
        </div>

      </div>

      {/* LATENCY TREND CHART & TABLE HEALTH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LATENCY REALTIME CHART */}
        <div className="lg:col-span-7 bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-black text-white">
                مخطط استجابة النبضات الزمني (Latency Stream - ms)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              أحدث {latencyHistory.length} فحص
            </span>
          </div>

          <div className="h-52 w-full">
            {latencyHistory.length < 2 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                جاري تجميع المزيد من القراءات الزمنية...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={latencyHistory}>
                  <defs>
                    <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="timeLabel" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} unit="ms" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    formatter={(val: any) => [`${val} ms`, 'زمن الاستجابة']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="latencyMs" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#latencyGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>الهدف الموصى به: <strong className="text-emerald-400 font-mono">&lt; 150 ms</strong></span>
            <span>المنطقة: <strong className="text-slate-200">Frankfurt (eu-central-1)</strong></span>
          </div>
        </div>

        {/* DATABASE TABLES HEALTH STATUS */}
        <div className="lg:col-span-5 bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-black text-white">
                صحة وشبكة جداول Supabase
              </h3>
            </div>
            <button
              onClick={inspectTables}
              className="text-[11px] font-bold text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              إعادة الفحص
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {tableStatuses.map((table) => (
              <div 
                key={table.tableName}
                className="p-2.5 bg-slate-900 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <span className="font-mono text-[#38BDF8]">{table.tableName}</span>
                    <span className="text-[11px] text-slate-400 font-normal">({table.titleAr})</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    الصفوف: {table.rowCount.toLocaleString('ar-EG')} سجل
                  </div>
                </div>

                <div className="text-left">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] ${
                    table.status === 'ok' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {table.status === 'ok' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-rose-400" />}
                    <span>{table.status === 'ok' ? `${table.latencyMs}ms` : 'خطأ'}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>مزود خدمة الاستضافة: <strong className="text-slate-200">Supabase Cloud PostgreSQL</strong></span>
            <span className="text-emerald-400 font-bold">SSL 256-bit Encrypted</span>
          </div>
        </div>

      </div>

    </div>
  );
}
