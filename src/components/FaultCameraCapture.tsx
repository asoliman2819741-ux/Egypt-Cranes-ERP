import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RotateCw, X, Image, UploadCloud, CheckCircle, RefreshCw, VideoOff } from 'lucide-react';

interface FaultCameraCaptureProps {
  onImageCaptured: (base64Image: string) => void;
  initialImage?: string;
  onClear?: () => void;
}

export default function FaultCameraCapture({ onImageCaptured, initialImage, onClear }: FaultCameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(initialImage || null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep streamRef updated
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    if (initialImage) {
      setCapturedImage(initialImage);
    }
  }, [initialImage]);

  // Handle cleanup of stream when unmounting
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = async () => {
    setError(null);
    setIsCameraActive(true);
    try {
      if (streamRef.current) {
        stopCamera();
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => {
          console.error("Error playing video:", e);
        });
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setError('تعذر الوصول إلى الكاميرا. يرجى التحقق من الصلاحيات أو استخدام خيار رفع الصور.');
      setIsCameraActive(false);
    }
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    // Restart camera with new facing mode if active
    if (isCameraActive) {
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Set canvas dimensions to match video stream
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas image to compressed jpeg base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        onImageCaptured(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة صالح فقط.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCapturedImage(result);
        onImageCaptured(result);
      }
    };
    reader.onerror = () => {
      setError('حدث خطأ أثناء قراءة ملف الصورة.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleClearImage = () => {
    setCapturedImage(null);
    if (onClear) {
      onClear();
    }
    stopCamera();
  };

  return (
    <div className="space-y-4">
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">الدليل المرئي للعطل الفني (صورة الرافعة أو العيب)</label>
      
      {/* Container display */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-full rounded-2xl border-2 border-dashed overflow-hidden transition-all duration-200 ${
          isDragging 
            ? 'border-[#0F4C81] bg-[#0F4C81]/5 scale-[0.99]' 
            : capturedImage 
              ? 'border-emerald-300 bg-emerald-50/10' 
              : isCameraActive 
                ? 'border-[#0F4C81] bg-slate-950' 
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
        }`}
        style={{ minHeight: '220px' }}
      >
        {/* State 1: Image captured / supplied */}
        {capturedImage && !isCameraActive && (
          <div className="relative group flex flex-col items-center justify-center p-3 h-full min-h-[220px]">
            <img 
              src={capturedImage} 
              alt="Fault visualization" 
              className="max-h-60 rounded-xl object-cover shadow-sm w-full"
            />
            
            {/* Delete / Clear button */}
            <button
              type="button"
              onClick={handleClearImage}
              className="absolute top-5 right-5 p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md transition-transform hover:scale-110 cursor-pointer"
              title="حذف الصورة"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="absolute bottom-5 left-5 right-5 bg-slate-900/80 backdrop-blur-xs text-white px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-between">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                تم التقاط / رفع الصورة بنجاح
              </span>
              <button
                type="button"
                onClick={() => {
                  setCapturedImage(null);
                  startCamera();
                }}
                className="text-slate-300 hover:text-white flex items-center gap-1 font-extrabold cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                إعادة التقاط 📷
              </button>
            </div>
          </div>
        )}

        {/* State 2: Active Camera Viewport */}
        {isCameraActive && (
          <div className="relative flex flex-col items-center justify-center min-h-[240px] bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-h-64 object-cover"
            />
            
            {/* Controls overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black/60 backdrop-blur-xs p-2 rounded-xl">
              <button
                type="button"
                onClick={stopCamera}
                className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                title="إغلاق الكاميرا"
              >
                <VideoOff className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={capturePhoto}
                className="w-12 h-12 bg-rose-600 hover:bg-rose-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                title="التقاط صورة"
              >
                <div className="w-4 h-4 bg-white rounded-full animate-ping absolute opacity-30" />
                <Camera className="w-5 h-5 text-white" />
              </button>

              <button
                type="button"
                onClick={toggleCameraFacing}
                className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                title="قلب الكاميرا"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* State 3: Static Placeholder (No image and No camera) */}
        {!capturedImage && !isCameraActive && (
          <div className="flex flex-col items-center justify-center p-6 text-center h-full min-h-[220px] space-y-4">
            <div className="p-3 bg-slate-100 rounded-2xl text-slate-400">
              <Camera className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-extrabold text-slate-700">اسحب صورة العطل هنا أو استخدم أدوات الإدخال</p>
              <p className="text-[10px] text-slate-400 font-bold">يمكنك تشغيل الكاميرا فوراً من الويب أو رفع ملف</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={startCamera}
                className="flex items-center gap-1.5 py-1.5 px-3 bg-[#0F4C81] hover:bg-[#0c3d67] text-white text-[11px] font-black rounded-lg transition-all shadow-xs cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                تشغيل الكاميرا الحية 📸
              </button>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                رفع ملف صورة 📁
              </button>
            </div>

            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        )}
      </div>

      {error && (
        <p className="text-[10px] text-rose-600 font-extrabold bg-rose-50 p-2 rounded-lg border border-rose-100">
          ⚠️ {error}
        </p>
      )}

      {/* Hidden canvas for capturing video frames */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
