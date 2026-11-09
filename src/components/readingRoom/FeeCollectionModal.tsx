import React, { useState } from 'react';
import { X, CreditCard, Receipt, Calendar, ArrowRight, User } from 'lucide-react';
import { useReadingRoom } from '../../context/ReadingRoomContext';
import { useApp } from '../../context/AppContext';
import { RRStudent } from '../../types/readingRoom';

interface FeeCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedStudent?: RRStudent | null;
  onSuccess: (receipt: any) => void;
}

export const FeeCollectionModal: React.FC<FeeCollectionModalProps> = ({
  isOpen,
  onClose,
  preselectedStudent,
  onSuccess,
}) => {
  const { students, plans, collectFee } = useReadingRoom();
  const { settings, addToast } = useApp();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(preselectedStudent?.id || '');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'ONLINE' | 'CARD'>('UPI');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when preselectedStudent changes or modal opens
  React.useEffect(() => {
    if (preselectedStudent) {
      setSelectedStudentId(preselectedStudent.id);
      setSelectedPlanId(preselectedStudent.planId);
      setAmount(preselectedStudent.dueAmount > 0 ? preselectedStudent.dueAmount : preselectedStudent.feeAmount);
    } else if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
      setSelectedPlanId(students[0].planId);
      setAmount(students[0].dueAmount > 0 ? students[0].dueAmount : students[0].feeAmount);
    }
  }, [preselectedStudent, isOpen, students]);

  const currentStudent = students.find((s) => s.id === selectedStudentId);
  const currentPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  const handleStudentChange = (sId: string) => {
    setSelectedStudentId(sId);
    const stu = students.find((s) => s.id === sId);
    if (stu) {
      setSelectedPlanId(stu.planId);
      setAmount(stu.dueAmount > 0 ? stu.dueAmount : stu.feeAmount);
    }
  };

  const handlePlanChange = (pId: string) => {
    setSelectedPlanId(pId);
    const pl = plans.find((p) => p.id === pId);
    if (pl) {
      setAmount(pl.fee);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) {
      addToast({ type: 'error', title: 'Select Student', message: 'Please select a student to collect fee.' });
      return;
    }
    if (amount <= 0) {
      addToast({ type: 'error', title: 'Invalid Amount', message: 'Payment amount must be greater than zero.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await collectFee({
        studentId: currentStudent.id,
        amount,
        paymentMethod,
        discount,
        planId: selectedPlanId,
        notes,
      });

      if (!res.success) {
        addToast({ type: 'error', title: 'Payment Failed', message: res.error });
      } else {
        addToast({
          type: 'success',
          title: 'Fee Collected',
          message: `Recorded payment of ${settings.currencySymbol || '₹'}${amount} for ${currentStudent.name}.`,
        });
        onSuccess(res.receipt);
        onClose();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err?.message || 'Failed to collect fee.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 rounded-xl">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Collect Fee & Issue Receipt</h3>
              <p className="text-xs text-slate-300">फीस जमा करें व रसीद बनाएं</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Select Student */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Select Student (छात्र चुनें) *
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.studentId}) — Seat: {s.allottedSeatNumber || 'None'} | Due: {settings.currencySymbol || '₹'}{s.dueAmount}
                </option>
              ))}
            </select>
          </div>

          {/* Student Status Summary Card */}
          {currentStudent && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Current Plan:</span>
                <span className="font-bold text-slate-900">{currentStudent.planName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Current Expiry:</span>
                <span
                  className={`font-mono font-bold ${
                    currentStudent.status === 'expired' ? 'text-rose-600' : 'text-indigo-700'
                  }`}
                >
                  {new Date(currentStudent.expiryDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  ({currentStudent.status})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Pending Due Amount:</span>
                <span className="font-bold text-rose-600 font-mono text-sm">
                  {settings.currencySymbol || '₹'}
                  {currentStudent.dueAmount.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Membership Plan renewal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Plan To Renew / Pay For (प्लान)
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => handlePlanChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {settings.currencySymbol || '₹'}
                  {p.fee} ({p.durationDays} Days)
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paying Amount ({settings.currencySymbol || '₹'}) *
              </label>
              <input
                type="number"
                min={1}
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Discount ({settings.currencySymbol || '₹'})
              </label>
              <input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Mode (माध्यम) *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['UPI', 'CASH', 'CARD', 'ONLINE'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMethod(mode)}
                  className={`py-2 text-xs font-bold rounded-xl border cursor-pointer transition text-center ${
                    paymentMethod === mode
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Remarks (टिप्पणी / रसीद विवरण)
            </label>
            <input
              type="text"
              placeholder="e.g. Monthly fee paid via GPay, UTR #483920..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer transition shadow-md active:scale-98"
            >
              <CreditCard className="w-4 h-4" />
              {isSubmitting ? 'Recording...' : 'Collect & Generate Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
