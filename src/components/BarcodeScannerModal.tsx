import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, X, Scan, RefreshCw, CheckCircle2, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, Package, Warehouse, 
  Volume2, VolumeX, Flashlight, FlashlightOff, Upload, 
  Plus, Minus, Check, Search, Printer, Tag, ShoppingCart,
  Layers, ExternalLink, HelpCircle
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';
import { InventoryItem, CostCenter } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItems: InventoryItem[];
  costCenters: CostCenter[];
  onUpdateInventoryQty: (itemId: string, newQty: number) => void;
  onRegisterNewItemWithCode?: (scannedCode: string) => void;
  onSelectForReceipt?: (item: InventoryItem) => void;
  onSelectForIssue?: (item: InventoryItem) => void;
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  inventoryItems,
  costCenters,
  onUpdateInventoryQty,
  onRegisterNewItemWithCode,
  onSelectForReceipt,
  onSelectForIssue
}: BarcodeScannerModalProps) {
  // Scanner state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [manualInput, setManualInput] = useState<string>('');
  
  // Scanned item & action state
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [matchedItem, setMatchedItem] = useState<InventoryItem | null>(null);
  const [scanTimestamp, setScanTimestamp] = useState<number>(0);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Quick Action form inside modal
  const [quickQty, setQuickQty] = useState<number>(1);
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'scanner' | 'testLabels'>('scanner');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerDivId = 'barcode-reader-viewport';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synthesize beep on successful scan
  const playBeepSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12); // High beep
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio context might be restricted before user gesture
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([60, 40, 60]);
      } catch {
        // Ignore vibration error
      }
    }
  }, [soundEnabled]);

  // Lookup scanned code in items
  const handleProcessCode = useCallback((rawCode: string) => {
    const cleanCode = rawCode.trim();
    if (!cleanCode) return;

    playBeepSound();
    setLastScannedCode(cleanCode);
    setScanTimestamp(Date.now());
    setActionSuccessMsg(null);
    setQuickQty(1);

    // Search item by exact code or id or partial match
    const found = inventoryItems.find(
      i => i.code.toLowerCase() === cleanCode.toLowerCase() ||
           i.id === cleanCode ||
           i.nameAr.toLowerCase().includes(cleanCode.toLowerCase())
    );

    if (found) {
      setMatchedItem(found);
    } else {
      setMatchedItem(null);
    }
  }, [inventoryItems, playBeepSound]);

  // Stop scanner safely
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setTorchOn(false);
  }, []);

  // Start scanner
  const startScanner = useCallback(async (facing: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    await stopScanner();

    // Ensure DOM container is ready
    const element = document.getElementById(readerDivId);
    if (!element) {
      setTimeout(() => startScanner(facing), 150);
      return;
    }

    try {
      const html5QrCode = new Html5Qrcode(readerDivId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 280, height: 180 },
        aspectRatio: 1.333334,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.DATA_MATRIX
        ]
      };

      await html5QrCode.start(
        { facingMode: facing },
        config,
        (decodedText) => {
          handleProcessCode(decodedText);
        },
        () => {
          // Ignore individual frame decode errors
        }
      );

      setIsScanning(true);
    } catch (err: unknown) {
      console.error('Camera start failed:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission')) {
        setCameraError('تم رفض إذن الوصول للكاميرا، يرجى تفعيل إذن الكاميرا من إعدادات المتصفح.');
      } else if (errMsg.includes('NotFoundError') || errMsg.includes('DevicesNotFoundError')) {
        setCameraError('لم يتم العثور على كاميرا متصلة بالجهاز.');
      } else {
        setCameraError('تعذر تشغيل الكاميرا عبر هذا المتصفح. يمكنك إدخال الكود يدوياً أو رفع صورة الباركود.');
      }
      setIsScanning(false);
    }
  }, [facingMode, handleProcessCode, stopScanner]);

  // Lifecycle control
  useEffect(() => {
    if (isOpen && activeSubTab === 'scanner') {
      const timer = setTimeout(() => {
        startScanner(facingMode);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [isOpen, activeSubTab, facingMode, startScanner, stopScanner]);

  // Handle modal close cleanup
  const handleModalClose = () => {
    stopScanner();
    setLastScannedCode(null);
    setMatchedItem(null);
    setActionSuccessMsg(null);
    onClose();
  };

  // Toggle Torch if supported
  const toggleTorch = async () => {
    if (!scannerRef.current || !isScanning) return;
    try {
      // Html5Qrcode doesn't have direct toggleTorch in all versions, fallback via track capabilities
      const videoElem = document.querySelector(`#${readerDivId} video`) as HTMLVideoElement | null;
      if (videoElem && videoElem.srcObject) {
        const stream = videoElem.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities ? (track.getCapabilities() as { torch?: boolean }) : {};
        if (capabilities.torch) {
          const nextTorch = !torchOn;
          await track.applyConstraints({
            advanced: [{ torch: nextTorch } as MediaTrackConstraintSet]
          });
          setTorchOn(nextTorch);
        } else {
          alert('الفلاش غير مدعوم في هذه الكاميرا');
        }
      }
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  // Toggle Camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  // Scan from uploaded file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode('barcode-file-scan-temp');
      const decodedText = await html5QrCode.scanFile(file, true);
      handleProcessCode(decodedText);
      await html5QrCode.clear();
    } catch {
      alert('لم يتم التعرف على أي باركود أو QR في هذه الصورة. يرجى تجربة صورة أوضح.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Manual code submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleProcessCode(manualInput.trim());
    setManualInput('');
  };

  // Quick Action 1: Add Stock (وارد)
  const handleQuickAddStock = (qtyToAdd: number) => {
    if (!matchedItem) return;
    const newQty = matchedItem.currentQty + qtyToAdd;
    onUpdateInventoryQty(matchedItem.id, newQty);
    
    // Update local matched item instance
    setMatchedItem(prev => prev ? { ...prev, currentQty: newQty } : null);
    setActionSuccessMsg(`✅ تم بنجاح إضافة (+${qtyToAdd} ${matchedItem.unit}) إلى رصيد الصنف. الرصيد الجديد: ${newQty} ${matchedItem.unit}`);
  };

  // Quick Action 2: Issue Stock (صرف)
  const handleQuickIssueStock = (qtyToIssue: number) => {
    if (!matchedItem) return;
    if (qtyToIssue > matchedItem.currentQty) {
      alert('الكمية المراد صرفها تتجاوز الرصيد المتاح بالمخزن!');
      return;
    }
    const newQty = matchedItem.currentQty - qtyToIssue;
    onUpdateInventoryQty(matchedItem.id, newQty);
    
    setMatchedItem(prev => prev ? { ...prev, currentQty: newQty } : null);
    setActionSuccessMsg(`📤 تم بنجاح صرف (-${qtyToIssue} ${matchedItem.unit}) للصنف. الرصيد المتبقي: ${newQty} ${matchedItem.unit}`);
  };

  // Quick Action 3: Set exact stock count (جرد فعلي)
  const handleSetStockCount = (exactQty: number) => {
    if (!matchedItem) return;
    if (exactQty < 0) return;
    onUpdateInventoryQty(matchedItem.id, exactQty);
    setMatchedItem(prev => prev ? { ...prev, currentQty: exactQty } : null);
    setActionSuccessMsg(`🎯 تم ضبط وتحديث الرصيد الفعلي للصنف إلى (${exactQty} ${matchedItem.unit}) بنجاح!`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 dir-rtl text-right font-sans overflow-y-auto">
      {/* Hidden container for file scanning */}
      <div id="barcode-file-scan-temp" className="hidden"></div>

      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F4C81] via-[#1a5f9e] to-[#0F4C81] p-5 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Scan className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">قارئ الباركود الذكي بالكاميرا (Barcode & QR Scanner)</h3>
                <span className="px-2 py-0.5 bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-bold">
                  لايف ⚡
                </span>
              </div>
              <p className="text-xs text-blue-100/90 mt-0.5">
                مسح الباركود للتعرف الفوري على الأصناف وتحديث الأرصدة وإضافة الوارد والمنصرف دون كتابة يدوية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled 
                  ? 'bg-white/20 border-white/30 text-white' 
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
              title={soundEnabled ? 'صوت التنبيه مفعل' : 'كتم صوت التنبيه'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={handleModalClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-tabs header */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('scanner')}
              className={`px-4 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'scanner'
                  ? 'bg-[#0F4C81] text-white shadow-xs'
                  : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-200/60'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>ماسح الكاميرا الفوري</span>
            </button>

            <button
              onClick={() => setActiveSubTab('testLabels')}
              className={`px-4 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'testLabels'
                  ? 'bg-[#0F4C81] text-white shadow-xs'
                  : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-200/60'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>باركود الأصناف وقوالب الطباعة 🏷️</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
            يدعم: Code-128, EAN-13, QR Code, UPC, Code-39
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {activeSubTab === 'scanner' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Column: Scanner Viewport */}
              <div className="lg:col-span-6 space-y-4">
                <div className="relative bg-slate-950 rounded-2xl overflow-hidden shadow-inner border-2 border-slate-800 aspect-4/3 flex items-center justify-center">
                  
                  {/* html5-qrcode target container */}
                  <div 
                    id={readerDivId} 
                    className="w-full h-full overflow-hidden flex items-center justify-center"
                    style={{ position: 'relative' }}
                  />

                  {/* Laser Scanning Overlay Animation */}
                  {isScanning && !cameraError && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      {/* Bounding box guide with glowing corners */}
                      <div className="relative w-64 h-40 border border-blue-400/40 rounded-xl">
                        {/* Corner markers */}
                        <div className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-cyan-400 rounded-tl-md"></div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-cyan-400 rounded-tr-md"></div>
                        <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-cyan-400 rounded-bl-md"></div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-cyan-400 rounded-br-md"></div>

                        {/* Animated Laser line */}
                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#22d3ee] animate-bounce duration-1000"></div>

                        <div className="absolute bottom-2 inset-x-0 text-center">
                          <span className="px-2 py-0.5 bg-black/60 backdrop-blur-xs text-[10px] text-cyan-300 rounded-md font-mono font-bold tracking-wider">
                            ضع الباركود أو الـ QR داخل الإطار
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Camera Error / Fallback State */}
                  {cameraError && (
                    <div className="absolute inset-0 bg-slate-900/90 p-5 flex flex-col items-center justify-center text-center text-white space-y-3 z-10">
                      <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl">
                        <AlertTriangle className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white mb-1">تعذر تشغيل الكاميرا</h4>
                        <p className="text-xs text-slate-300 max-w-xs leading-relaxed">{cameraError}</p>
                      </div>
                      <button
                        onClick={() => startScanner(facingMode)}
                        className="px-4 py-2 bg-[#0F4C81] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>إعادة محاولة تشغيل الكاميرا</span>
                      </button>
                    </div>
                  )}

                  {/* Top Bar Controls Inside Camera */}
                  {isScanning && (
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-auto">
                      <span className="px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-lg text-[10px] text-emerald-400 font-black border border-emerald-500/30 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        الكاميرا تعمل
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={toggleTorch}
                          className={`p-2 rounded-xl backdrop-blur-md transition-colors cursor-pointer ${
                            torchOn ? 'bg-amber-500 text-white' : 'bg-black/60 text-white/80 hover:text-white'
                          }`}
                          title="تشغيل/إطفاء الفلاش"
                        >
                          {torchOn ? <Flashlight className="w-4 h-4 text-amber-200" /> : <FlashlightOff className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={toggleFacingMode}
                          className="p-2 rounded-xl bg-black/60 backdrop-blur-md text-white/80 hover:text-white transition-colors cursor-pointer"
                          title="تبديل الكاميرا الأمامية/الخلفية"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Auxiliary Scanner Controls: Upload photo & Manual input */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  {/* File Upload Button */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>مسح من صورة مخزنة 📁</span>
                  </button>

                  <button
                    onClick={() => startScanner(facingMode)}
                    className="w-full sm:w-auto py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                    title="إعادة تهيئة الكاميرا"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>إعادة الضبط</span>
                  </button>
                </div>

                {/* Manual barcode entry form */}
                <form onSubmit={handleManualSubmit} className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    أو أدخل كود الباركود يدوياً (للتجربة السريعة):
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="مثال: EC-INV-001 أو 88012345..."
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        className="w-full pr-8 pl-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                      />
                      <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#0F4C81] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                    >
                      بحث بالكود
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Scanned Item Details & Quick Actions */}
              <div className="lg:col-span-6 space-y-4">
                
                {/* Result Status Banner */}
                {lastScannedCode ? (
                  <div className="space-y-4">
                    
                    {/* Success notification banner */}
                    {actionSuccessMsg && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in duration-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="font-semibold leading-relaxed">{actionSuccessMsg}</span>
                      </div>
                    )}

                    {/* Matched Item Card */}
                    {matchedItem ? (
                      <div className="bg-slate-50 dark:bg-slate-800/80 border-2 border-emerald-500/40 rounded-2xl p-4.5 space-y-4 shadow-sm">
                        
                        {/* Header of Item */}
                        <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-black rounded-md flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                صنف مسجل بالمخزن
                              </span>
                              <span className="font-mono text-xs font-black text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                {matchedItem.code}
                              </span>
                            </div>
                            <h4 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                              {matchedItem.nameAr}
                            </h4>
                          </div>

                          <div className="text-left shrink-0">
                            <span className="text-[10px] text-slate-400 block font-medium">سعر الوحدة</span>
                            <span className="text-sm font-extrabold text-[#0F4C81] dark:text-blue-400">
                              {matchedItem.unitPrice.toLocaleString()} ج.م
                            </span>
                          </div>
                        </div>

                        {/* Item Metadata Metrics */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] text-slate-400 block">الرصيد الفعلي</span>
                            <span className={`text-base font-black ${
                              matchedItem.currentQty <= matchedItem.minQty ? 'text-rose-600' : 'text-slate-800 dark:text-slate-100'
                            }`}>
                              {matchedItem.currentQty} <span className="text-xs font-bold text-slate-500">{matchedItem.unit}</span>
                            </span>
                          </div>

                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] text-slate-400 block">حد الطلب الأدنى</span>
                            <span className="text-base font-black text-slate-700 dark:text-slate-300">
                              {matchedItem.minQty} <span className="text-xs font-bold text-slate-500">{matchedItem.unit}</span>
                            </span>
                          </div>

                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] text-slate-400 block">إجمالي القيمة</span>
                            <span className="text-sm font-black text-[#0F4C81] dark:text-blue-400">
                              {(matchedItem.currentQty * matchedItem.unitPrice).toLocaleString()} <span className="text-[10px]">ج.م</span>
                            </span>
                          </div>
                        </div>

                        {/* Warehouse Location & Category */}
                        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-1.5">
                            <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                            <span>المستودع: <strong className="text-slate-700 dark:text-slate-200">{matchedItem.warehouseName}</strong></span>
                          </div>
                          <div>
                            <span>الفئة: <strong className="text-slate-700 dark:text-slate-200">{matchedItem.category}</strong></span>
                          </div>
                        </div>

                        {/* ⚡ Quick Stock Actions Toolbar */}
                        <div className="space-y-2.5 pt-1 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <span>إجراء حركة مخزنية سريعة:</span>
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-slate-400">الكمية:</span>
                              <input
                                type="number"
                                min={1}
                                value={quickQty}
                                onChange={(e) => setQuickQty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-14 px-2 py-0.5 text-center font-bold text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900"
                              />
                            </div>
                          </div>

                          {/* Action Buttons Grid */}
                          <div className="grid grid-cols-2 gap-2">
                            {/* Quick Add (وارد) */}
                            <button
                              onClick={() => handleQuickAddStock(quickQty)}
                              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs flex items-center justify-center gap-1.5"
                            >
                              <Plus className="w-4 h-4" />
                              <span>إضافة وارد (+{quickQty} {matchedItem.unit}) 📥</span>
                            </button>

                            {/* Quick Issue (منصرف) */}
                            <button
                              onClick={() => handleQuickIssueStock(quickQty)}
                              className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs flex items-center justify-center gap-1.5"
                            >
                              <Minus className="w-4 h-4" />
                              <span>صرف منصرف (-{quickQty} {matchedItem.unit}) 📤</span>
                            </button>
                          </div>

                          {/* Direct Set Quantity (جرد وتعديل فعلي) */}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => {
                                const val = prompt(`أدخل الرصيد الفعلي الفعلي المحصور حالياً للصنف (${matchedItem.nameAr}):`, String(matchedItem.currentQty));
                                if (val !== null && !isNaN(Number(val))) {
                                  handleSetStockCount(parseFloat(val));
                                }
                              }}
                              className="flex-1 py-1.5 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                            >
                              <span>🎯 تعديل الجرد الفعلي المباشر</span>
                            </button>

                            {onSelectForReceipt && (
                              <button
                                onClick={() => {
                                  onSelectForReceipt(matchedItem);
                                  handleModalClose();
                                }}
                                className="py-1.5 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 text-[#0F4C81] dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                title="الانتقال لتبويب إذن إضافة وارد"
                              >
                                <span>سند وارد كامل 📑</span>
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    ) : (
                      /* Not Found in Catalog State */
                      <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 rounded-2xl p-5 space-y-4 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 mx-auto flex items-center justify-center">
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                            تم مسح الكود: <span className="font-mono text-amber-700 dark:text-amber-400">{lastScannedCode}</span>
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xs mx-auto">
                            هذا الباركود غير مسجل حالياً في كتالوج أصناف المخازن. هل ترغب في تسجيل صنف جديد بهذا الكود؟
                          </p>
                        </div>

                        {onRegisterNewItemWithCode && (
                          <button
                            onClick={() => {
                              onRegisterNewItemWithCode(lastScannedCode);
                              handleModalClose();
                            }}
                            className="py-2.5 px-4 bg-[#0F4C81] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            <span>تعريف صنف جديد بهذا الباركود</span>
                          </button>
                        )}
                      </div>
                    )}

                  </div>
                ) : (
                  /* Waiting for scan placeholder */
                  <div className="h-full min-h-[300px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-14 h-14 rounded-3xl bg-blue-50 dark:bg-slate-800 text-[#0F4C81] dark:text-blue-400 flex items-center justify-center">
                      <Scan className="w-7 h-7 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">بانتظار قراءة الباركود...</h4>
                      <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
                        وجه كاميرا الهاتف أو الحاسوب نحو الملصق على قطعة الغيار أو صندوق البضاعة للتعرف عليها فورياً.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Tab 2: Test Barcodes & Print Labels */}
          {activeSubTab === 'testLabels' && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-blue-100 dark:border-slate-700 flex items-start gap-3">
                <div className="p-2 bg-[#0F4C81] text-white rounded-xl">
                  <Tag className="w-5 h-5" />
                </div>
                <div className="text-xs space-y-0.5">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    ملصقات الباركود والـ QR للأصناف الحالية (للتجربة والطباعة)
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    يمكنك توجيه كاميرا الهاتف لمسح هذه الرموز مباشرة من الشاشة لاختبار سرعة التعرف وتحديث الأرصدة.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {inventoryItems.slice(0, 9).map(item => (
                  <div 
                    key={item.id}
                    className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-3xs flex flex-col justify-between gap-3 hover:border-[#0F4C81] transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white block line-clamp-1">
                          {item.nameAr}
                        </span>
                        <span className="font-mono text-[11px] font-black text-slate-600 dark:text-slate-300">
                          {item.code}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                        {item.currentQty} {item.unit}
                      </span>
                    </div>

                    {/* QR Code and simulate barcode lines */}
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                        {/* CSS Barcode illustration */}
                        <div className="flex items-center gap-0.5 h-7 px-1 bg-white rounded border border-slate-200">
                          {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2].map((w, idx) => (
                            <div key={idx} className={`bg-slate-900 h-full`} style={{ width: `${w * 1.5}px` }}></div>
                          ))}
                        </div>
                        <span className="font-mono text-[9px] text-slate-400 block text-center tracking-widest">{item.code}</span>
                      </div>

                      <div className="p-1 bg-white rounded-lg shadow-2xs">
                        <QRCodeSVG value={item.code} size={50} level="M" />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleProcessCode(item.code);
                        setActiveSubTab('scanner');
                      }}
                      className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Scan className="w-3.5 h-3.5 text-[#0F4C81] dark:text-blue-400" />
                      <span>اختبار مسح هذا الصنف ⚡</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <HelpCircle className="w-4 h-4" />
            <span>نصيحة: تأكد من إضاءة جيدة حول الملصق لتسريع القراءة.</span>
          </div>
          <button
            onClick={handleModalClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}
