import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  QrCode,
  Keyboard,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export interface ScannedResult {
  raw: string;
  type?: 'STUDENT' | 'BOOK' | 'MEMBER' | 'UNKNOWN';
  id?: string;
  data?: any;
}

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: ScannedResult) => void;
  title?: string;
  subtitle?: string;
  expectedType?: 'STUDENT' | 'BOOK' | 'MEMBER' | 'ANY';
  sampleItems?: Array<{ id: string; label: string; code: string; type?: 'STUDENT' | 'BOOK' | 'MEMBER' }>;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan QR Code / Barcode',
  subtitle = 'Point camera at the QR code, or use a USB scanner / manual entry',
  expectedType = 'ANY',
  sampleItems = [],
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual' | 'quick'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const manualInputRef = useRef<HTMLInputElement | null>(null);

  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.16);
    } catch {
      // AudioContext fallback
    }
  };

  const parseScannedValue = (raw: string): ScannedResult => {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return {
          raw: trimmed,
          type: parsed.type || 'UNKNOWN',
          id: parsed.id || parsed.studentId || parsed.bookId || parsed.isbn,
          data: parsed,
        };
      } catch {
        // Fall back
      }
    }

    if (trimmed.startsWith('RR-') || trimmed.startsWith('STU-') || trimmed.includes('STD')) {
      return { raw: trimmed, type: 'STUDENT', id: trimmed };
    }
    if (trimmed.startsWith('BK-') || trimmed.startsWith('978-') || trimmed.startsWith('979-') || /^\d{10,13}$/.test(trimmed)) {
      return { raw: trimmed, type: 'BOOK', id: trimmed };
    }
    if (trimmed.startsWith('MEM-') || trimmed.startsWith('LIB-')) {
      return { raw: trimmed, type: 'MEMBER', id: trimmed };
    }

    return { raw: trimmed, type: 'UNKNOWN', id: trimmed };
  };

  const handleValidScan = (raw: string) => {
    if (!raw.trim()) return;
    const result = parseScannedValue(raw);
    setLastScanned(result.id || result.raw);
    playBeep();
    onScan(result);
  };

  useEffect(() => {
    if (!isOpen) return;
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === manualInputRef.current) return;
      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 150) buffer = '';
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 2) {
          e.preventDefault();
          handleValidScan(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCamera();
      return;
    }
    startCamera();
    return () => stopCamera();
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a'],
        });

        const scanFrame = async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) {
            animationFrameRef.current = requestAnimationFrame(scanFrame);
            return;
          }
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              handleValidScan(barcodes[0].rawValue);
              await new Promise((r) => setTimeout(r, 1200));
            }
          } catch {
            // Frame skip
          }
          if (streamRef.current) {
            animationFrameRef.current = requestAnimationFrame(scanFrame);
          }
        };

        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Use manual / quick code picker.'
          : 'Unable to start camera. You can still scan via USB barcode scanner or manual entry.'
      );
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-scale-in flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/50 border border-indigo-400 flex items-center justify-center">
              <QrCode className="w-4 h-4 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">{title}</h3>
              <p className="text-[11px] text-slate-300">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title={soundEnabled ? 'Mute' : 'Enable sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 cursor-pointer transition ${
              activeTab === 'camera'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Live Camera Scan
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 cursor-pointer transition ${
              activeTab === 'manual'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            Barcode / Manual Input
          </button>
          {sampleItems.length > 0 && (
            <button
              onClick={() => setActiveTab('quick')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 cursor-pointer transition ${
                activeTab === 'quick'
                  ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Quick Select ({sampleItems.length})
            </button>
          )}
        </div>

        <div className="p-5 overflow-y-auto">
          {activeTab === 'camera' && (
            <div className="flex flex-col items-center">
              <div className="relative w-full aspect-4/3 max-w-sm bg-slate-950 rounded-xl overflow-hidden border-2 border-dashed border-indigo-500/50 shadow-inner flex items-center justify-center">
                <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-indigo-400 rounded-2xl relative shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-indigo-300 rounded-tl" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-indigo-300 rounded-tr" />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-indigo-300 rounded-bl" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-indigo-300 rounded-br" />
                    <div className="w-full h-0.5 bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-bounce mt-24" />
                  </div>
                </div>

                {cameraError && (
                  <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col items-center justify-center text-center text-white">
                    <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
                    <p className="text-xs font-semibold text-slate-200 mb-3">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('manual')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition"
                    >
                      Switch to Manual / USB Input
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between w-full max-w-sm text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Scanner active & listening
                </span>
                <button
                  onClick={() => {
                    stopCamera();
                    startCamera();
                  }}
                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset Camera
                </button>
              </div>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleValidScan(manualInput);
                  setManualInput('');
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter Code / Payload String
                  </label>
                  <input
                    ref={manualInputRef}
                    autoFocus
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="e.g. RR-2026-001 or 9780132350884 or scan barcode..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Handheld USB/Bluetooth barcode guns will type directly into this box.
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setManualInput('')}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    disabled={!manualInput.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer transition shadow-xs"
                  >
                    Submit Scan
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'quick' && sampleItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 mb-2">
                Click any record below to simulate a live scan event:
              </p>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {sampleItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleValidScan(item.code)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-left transition group cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-xs text-slate-800 block group-hover:text-indigo-900">
                        {item.label}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {item.code} {item.type ? `• ${item.type}` : ''}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100/70 group-hover:bg-indigo-600 group-hover:text-white px-2 py-1 rounded-md transition">
                      Simulate Scan →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {lastScanned && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-900 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Scanned: <strong className="font-mono">{lastScanned}</strong>
              </span>
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Target Mode: <strong className="uppercase text-slate-700">{expectedType}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold cursor-pointer transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
