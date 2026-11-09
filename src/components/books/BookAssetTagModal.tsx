import React, { useState } from 'react';
import { X, Printer, Download, BookOpen, Layers, Check, Copy, Tag, MapPin } from 'lucide-react';
import { Book } from '../../types';
import { useApp } from '../../context/AppContext';
import { QRCodeView } from '../common/QRCodeView';

interface BookAssetTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
}

export const BookAssetTagModal: React.FC<BookAssetTagModalProps> = ({
  isOpen,
  onClose,
  book,
}) => {
  const { settings } = useApp();
  const [copiesCount, setCopiesCount] = useState<number>(1);
  const [labelSize, setLabelSize] = useState<'standard' | 'compact' | 'spine'>('standard');

  if (!isOpen || !book) return null;

  const handlePrint = () => {
    window.print();
  };

  const copiesToRender = Array.from({ length: Math.min(Math.max(1, copiesCount), 12) }).map(
    (_, index) => {
      const copyNum = index + 1;
      const accessionId = `${book.isbn || book.id}-C${copyNum}`;
      const qrPayload = JSON.stringify({
        type: 'BOOK',
        id: book.id,
        isbn: book.isbn,
        title: book.title,
        copy: copyNum,
        shelf: book.shelfNumber || 'Main Stack',
      });

      return { copyNum, accessionId, qrPayload };
    }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-scale-in">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/60 flex items-center justify-center border border-indigo-400">
              <Tag className="w-4 h-4 text-indigo-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Book Asset QR Label & Spine Tag Generator</h3>
              <p className="text-[11px] text-slate-300">
                Generate printable barcode/QR asset tags for physical library books
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Labels
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Controls Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Copies to Print:</span>
              <select
                value={copiesCount}
                onChange={(e) => setCopiesCount(Number(e.target.value))}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
              >
                {Array.from({ length: Math.min(10, Math.max(1, book.totalCopies || 1)) }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} {i === 0 ? 'Tag' : 'Tags'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Label Format:</span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                <button
                  onClick={() => setLabelSize('standard')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition ${
                    labelSize === 'standard' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Standard (Cover / Inside)
                </button>
                <button
                  onClick={() => setLabelSize('spine')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition ${
                    labelSize === 'spine' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Spine Tag (Compact)
                </button>
              </div>
            </div>
          </div>

          <span className="text-[11px] text-slate-500 italic">
            Compatible with Avery 5160 / 5163 label sheets
          </span>
        </div>

        {/* Printable Asset Tag Container */}
        <div className="p-6 bg-slate-100/90 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {copiesToRender.map(({ copyNum, accessionId, qrPayload }) => (
              <div
                key={copyNum}
                className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-4 shadow-sm flex flex-col justify-between relative hover:border-indigo-400 transition"
              >
                {/* Header with Institution */}
                <div className="border-b border-slate-200 pb-2 mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 truncate">
                    {settings.institutionName || 'CENTRAL LIBRARY'}
                  </span>
                  <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                    COPY {copyNum} / {book.totalCopies || 1}
                  </span>
                </div>

                {/* QR Code and Meta Details */}
                <div className="flex items-start gap-3">
                  <div className="shrink-0 bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
                    <QRCodeView
                      value={qrPayload}
                      size={labelSize === 'spine' ? 70 : 88}
                      errorCorrectionLevel="M"
                    />
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <h4 className="font-black text-slate-900 text-xs line-clamp-2 leading-tight">
                      {book.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 truncate font-medium">
                      {book.author}
                    </p>

                    <div className="mt-2 space-y-1 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">ISBN:</span>
                        <span className="font-mono font-bold text-slate-800">{book.isbn || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Shelf:</span>
                        <span className="font-bold text-emerald-700">
                          {book.shelfNumber || 'Stack A1'}
                        </span>
                      </div>
                      {book.callNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Call No:</span>
                          <span className="font-mono font-semibold text-slate-700">
                            {book.callNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Barcode accession line */}
                <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>TAG ID: {accessionId}</span>
                  <span className="text-[9px] text-indigo-600 font-bold uppercase">
                    Scan to Issue / Return
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <p className="text-xs text-slate-500">
            Adhesive labels can be affixed to inside front cover and spine.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer transition shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Print Asset Tags
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
