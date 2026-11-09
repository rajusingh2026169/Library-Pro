import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { FineRecord, PaymentMethod } from '../../types';
import { useApp } from '../../context/AppContext';
import { DollarSign, Receipt, CreditCard } from 'lucide-react';

interface CollectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  fine: FineRecord | null;
  onReceiptReady?: (receiptNumber: string) => void;
}

export const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({
  isOpen,
  onClose,
  fine,
  onReceiptReady,
}) => {
  const { settings, collectFinePayment } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState('');

  if (!fine) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = collectFinePayment(fine.id, paymentMethod, notes.trim());
    if (res.success && res.receiptNumber) {
      onReceiptReady?.(res.receiptNumber);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Collect Overdue Fee Payment"
      subtitle="Process patron fine settlement and generate official receipt"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Bill Summary */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-bold uppercase text-[10px]">Patron</span>
            <span className="font-bold text-slate-800">{fine.memberName} ({fine.memberCode})</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-bold uppercase text-[10px]">Book Title</span>
            <span className="font-semibold text-slate-800 truncate max-w-[200px]">{fine.bookTitle}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-bold uppercase text-[10px]">Overdue Days</span>
            <span className="font-mono font-bold text-slate-800">{fine.overdueDays} days</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-base">
            <span className="font-bold text-slate-900">Total Due</span>
            <span className="font-black text-rose-600 font-mono">
              {settings.currencySymbol}{fine.amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Payment Method *
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 bg-white"
          >
            <option value="CASH">Cash at Circulation Counter</option>
            <option value="CARD">Credit / Debit Card Point of Sale</option>
            <option value="UPI">UPI / Digital QR Transfer</option>
            <option value="ONLINE">Student Financial Account Portal</option>
            <option value="BANK_TRANSFER">Direct Institutional Bank Wire</option>
          </select>
        </div>

        {/* Staff note */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Reference / Staff Note
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Card Auth #9421 or Counter Register"
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500"
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            Process & Print Receipt
          </button>
        </div>
      </form>
    </Modal>
  );
};
