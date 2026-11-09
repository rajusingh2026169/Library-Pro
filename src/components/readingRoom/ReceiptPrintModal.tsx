import React from 'react';
import { X, Printer, Receipt, CheckCircle, MapPin, Phone, Mail, Building } from 'lucide-react';
import { RRPayment } from '../../types/readingRoom';
import { useApp } from '../../context/AppContext';

interface ReceiptPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: RRPayment | null;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  isOpen,
  onClose,
  receipt,
}) => {
  const { settings } = useApp();

  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-scale-in">
        {/* Top bar (hidden in print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Payment Receipt (फीस रसीद)</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-8 bg-slate-50 flex justify-center">
          <div
            id="printable-fee-receipt"
            className="w-full bg-white p-6 sm:p-8 rounded-xl border border-slate-300 shadow-md relative text-slate-800"
          >
            {/* Header */}
            <div className="border-b-2 border-slate-800 pb-4 text-center">
              <div className="flex items-center justify-center gap-2 text-indigo-700 font-extrabold text-lg uppercase tracking-tight">
                <Building className="w-5 h-5" />
                {settings.institutionName || 'LibraryPro Modern Study Hall'}
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                {settings.libraryName || 'Central Reading Room & Digital Library'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-center gap-4 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {settings.address || 'University Campus, Prayagraj'}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" /> +91 {settings.phone || '9876543210'}
                </span>
              </p>
            </div>

            {/* Receipt Meta */}
            <div className="py-4 flex justify-between items-center text-xs border-b border-dashed border-slate-300">
              <div>
                <span className="text-slate-500 font-medium">Receipt No: </span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {receipt.receiptNumber}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-medium">Date: </span>
                <span className="font-bold text-slate-900">
                  {new Date(receipt.paymentDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Student & Seat Details */}
            <div className="py-4 grid grid-cols-2 gap-4 text-xs bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/80 my-3">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Patron / Student</span>
                <span className="font-black text-slate-900 text-sm block mt-0.5">
                  {receipt.studentName}
                </span>
                <span className="text-slate-600 font-mono text-xs">ID: {receipt.studentCode}</span>
                {receipt.mobile && (
                  <span className="text-slate-600 block text-[11px]">Mob: +91 {receipt.mobile}</span>
                )}
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Allocation Details</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  Plan: {receipt.planName}
                </span>
                {receipt.seatNumber ? (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-xs border border-emerald-300">
                    Seat: {receipt.seatNumber}
                  </span>
                ) : (
                  <span className="text-slate-500 text-xs italic">Seat Unallotted</span>
                )}
              </div>
            </div>

            {/* Payment Details Table */}
            <table className="w-full text-xs mt-4">
              <thead>
                <tr className="border-b-2 border-slate-300 text-slate-600 uppercase text-[10px]">
                  <th className="text-left py-2">Description</th>
                  <th className="text-left py-2">Validity Period</th>
                  <th className="text-right py-2">Amount ({settings.currencySymbol || '₹'})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 font-medium">
                    Reading Room Membership Fee ({receipt.planName})
                    {receipt.notes && (
                      <span className="block text-[10px] text-slate-500 mt-0.5">{receipt.notes}</span>
                    )}
                  </td>
                  <td className="py-3 text-slate-600">
                    {new Date(receipt.periodStart).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                    })}{' '}
                    to{' '}
                    {new Date(receipt.periodEnd).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-slate-900">
                    {settings.currencySymbol || '₹'}
                    {(receipt.amount + (receipt.discount || 0)).toFixed(2)}
                  </td>
                </tr>

                {receipt.discount > 0 && (
                  <tr>
                    <td colSpan={2} className="py-1.5 text-right text-slate-500">
                      Special Discount:
                    </td>
                    <td className="py-1.5 text-right font-mono text-rose-600">
                      -{settings.currencySymbol || '₹'}
                      {receipt.discount.toFixed(2)}
                    </td>
                  </tr>
                )}

                <tr className="border-t-2 border-slate-800 bg-slate-50 font-bold">
                  <td colSpan={2} className="py-2.5 text-right text-slate-900 uppercase">
                    Total Amount Paid:
                  </td>
                  <td className="py-2.5 text-right font-mono text-sm text-emerald-700">
                    {settings.currencySymbol || '₹'}
                    {receipt.netAmount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Payment Method Badge */}
            <div className="mt-4 flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="font-bold">Payment Status: Confirmed & Paid</span>
              </div>
              <span className="font-mono uppercase font-bold text-slate-700 px-2 py-0.5 bg-white rounded border border-emerald-200">
                Mode: {receipt.paymentMethod}
              </span>
            </div>

            {/* Signatures */}
            <div className="mt-10 pt-4 flex justify-between items-end text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Received By:</span>
                <span className="font-bold text-slate-700">{receipt.collectedBy || 'Admin Desk'}</span>
              </div>
              <div className="text-right">
                <div className="w-36 border-b border-slate-400 pb-1 text-center font-serif italic text-xs font-bold text-slate-800">
                  Authorized Signatory
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">Study Room Accounts</span>
              </div>
            </div>

            {/* Footer note */}
            <div className="mt-6 text-center text-[10px] text-slate-400 border-t border-slate-200 pt-2">
              This is a computer-generated fee receipt. Please preserve it for desk inspection.
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
