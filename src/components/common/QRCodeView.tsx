import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check, QrCode as QrIcon } from 'lucide-react';

interface QRCodeViewProps {
  value: string;
  size?: number;
  label?: string;
  subLabel?: string;
  showActions?: boolean;
  className?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  size = 140,
  label,
  subLabel,
  showActions = false,
  className = '',
  errorCorrectionLevel = 'M',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setDataUrl('');
      return;
    }

    let isMounted = true;
    QRCode.toDataURL(value, {
      width: size * 2, // 2x for sharp retina rendering
      margin: 1,
      color: {
        dark: '#0f172a', // slate-900
        light: '#ffffff',
      },
      errorCorrectionLevel,
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to generate QR code:', err);
          setError('Failed to generate QR code');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [value, size, errorCorrectionLevel]);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `qr-${(label || 'code').toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div
        className="relative bg-white p-2 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-center overflow-hidden"
        style={{ width: size + 16, height: size + 16 }}
      >
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={label || 'QR Code'}
            className="w-full h-full object-contain rounded"
          />
        ) : error ? (
          <div className="text-[11px] text-rose-500 flex flex-col items-center p-2">
            <QrIcon className="w-6 h-6 mb-1 text-rose-400" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="animate-pulse bg-slate-100 w-full h-full rounded flex items-center justify-center">
            <QrIcon className="w-6 h-6 text-slate-300" />
          </div>
        )}
      </div>

      {label && <span className="font-mono text-xs font-bold text-slate-800 mt-1.5">{label}</span>}
      {subLabel && <span className="text-[10px] text-slate-500 font-medium">{subLabel}</span>}

      {showActions && (
        <div className="flex items-center gap-1.5 mt-2">
          <button
            type="button"
            onClick={handleCopy}
            title="Copy payload string"
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            title="Download QR code image (PNG)"
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer transition"
          >
            <Download className="w-3 h-3" />
            <span>Download</span>
          </button>
        </div>
      )}
    </div>
  );
};
