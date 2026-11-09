import React from 'react';
import { Modal } from '../common/Modal';
import { FineRecord } from '../../types';
import { useApp } from '../../context/AppContext';
import { Printer, CheckCircle, BookMarked } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  fine: FineRecord | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  fine,
}) => {
  const { settings } = useApp();

  if (!fine) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official Fine Payment Receipt" maxWidth="md">
      <div className="space-y-6">
        {/* Printable Receipt Container */}
        <div id="printable-receipt" className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-300 text-xs text-slate-800 space-y-4 shadow-xs">
          {/* Header */}
          <div className="text-center border-b border-slate-200 pb-4">
            <div className="inline-flex p-2 rounded-xl bg-indigo-50 text-indigo-700 mb-1">
              <BookMarked className="w-6 h-6" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">{settings.institutionName}</h2>
            <h3 className="text-xs font-bold text-indigo-600">{settings.libraryName}</h3>
            <p className="text-[10px] text-slate-400 mt-1">{settings.address}</p>
            <p className="text-[10px] text-slate-400">Tel: {settings.phone} • Email: {settings.email}</p>
          </div>

          {/* Receipt Meta */}
          <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Receipt Number</span>
              <span className="font-mono font-bold text-slate-900">{fine.receiptNumber || 'REC-OFFICIAL'}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Date & Time</span>
              <span className="font-bold text-slate-900">
                {fine.paidAt ? new Date(fine.paidAt).toLocaleString() : new Date().toLocaleString()}
              </span>
            </div>
          </div>

          {/* Patron Information */}
          <div className="border-b border-slate-200 pb-3 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Patron Name:</span>
              <span className="font-bold text-slate-900">{fine.memberName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Member ID:</span>
              <span className="font-mono font-bold text-slate-900">{fine.memberCode}</span>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2 border-b border-slate-200 pb-4">
            <div className="flex justify-between font-bold text-slate-400 text-[10px] uppercase">
              <span>Description</span>
              <span>Amount</span>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-slate-900">{fine.bookTitle}</p>
                <p className="text-[10px] text-slate-500">
                  Late return assessment ({fine.overdueDays} days overdue)
                </p>
                {fine.notes && <p className="text-[10px] text-slate-400 italic">{fine.notes}</p>}
              </div>
              <span className="font-mono font-bold text-slate-900">
                {settings.currencySymbol}{fine.amount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method & Total */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Payment Mode:</span>
              <span className="font-bold text-slate-900 uppercase">{fine.paymentMethod || 'CASH'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Cashier / Staff:</span>
              <span className="font-semibold text-slate-800">{fine.collectedByUserName || 'Front Desk'}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-black pt-2 border-t border-slate-200">
              <span className="text-slate-900">Amount Paid (Full):</span>
              <span className="text-emerald-700 font-mono text-base">
                {settings.currencySymbol}{fine.amount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Footer Receipt Note */}
          <div className="pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">{settings.receiptFooter}</p>
            <p className="italic">Computer-generated official receipt. Valid without physical stamp.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>
      </div>
    </Modal>
  );
};
