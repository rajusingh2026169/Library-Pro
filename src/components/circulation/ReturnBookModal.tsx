import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { CirculationService } from '../../services/circulationService';
import { Loan, PaymentMethod, FineRecord } from '../../types';
import { Badge } from '../common/Badge';
import { AlertTriangle, CheckCircle2, CornerDownLeft, Receipt, DollarSign, QrCode } from 'lucide-react';
import { QRScannerModal, ScannedResult } from '../common/QRScannerModal';

interface ReturnBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedLoanId?: string;
  onReceiptGenerated?: (fine: FineRecord) => void;
}

export const ReturnBookModal: React.FC<ReturnBookModalProps> = ({
  isOpen,
  onClose,
  preselectedLoanId,
  onReceiptGenerated,
}) => {
  const { loans, settings, returnBook, language } = useApp();
  const isHindi = language === 'hi';

  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [payFineNow, setPayFineNow] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [returnNotes, setReturnNotes] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const activeLoans = useMemo(
    () => loans.filter((l) => l.status === 'active' || l.status === 'overdue'),
    [loans]
  );

  const handleScan = (result: ScannedResult) => {
    const raw = (result.id || result.raw || '').trim().toLowerCase();
    const found = activeLoans.find(
      (l) =>
        l.bookId.toLowerCase() === raw ||
        l.bookIsbn.toLowerCase() === raw ||
        l.memberId.toLowerCase() === raw ||
        l.memberCode.toLowerCase() === raw ||
        l.id.toLowerCase() === raw ||
        l.bookTitle.toLowerCase().includes(raw)
    );
    if (found) {
      setSelectedLoanId(found.id);
      setIsScannerOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedLoanId(preselectedLoanId || (activeLoans[0]?.id ?? ''));
      setPayFineNow(true);
      setPaymentMethod('CASH');
      setReturnNotes('Returned in normal condition');
    }
  }, [isOpen, preselectedLoanId, activeLoans]);

  const selectedLoan = useMemo(
    () => loans.find((l) => l.id === selectedLoanId),
    [loans, selectedLoanId]
  );

  // Calculate overdue fines in real time
  const fineCalculation = useMemo(() => {
    if (!selectedLoan) return { overdueDays: 0, chargeableDays: 0, fineAmount: 0 };
    return CirculationService.calculateOverdueFine(selectedLoan.dueDate, settings);
  }, [selectedLoan, settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId) return;

    const res = returnBook(selectedLoanId, {
      payFineNow: fineCalculation.fineAmount > 0 ? payFineNow : false,
      paymentMethod,
      notes: returnNotes.trim(),
    });

    if (res.success) {
      if (res.fineRecord && payFineNow && onReceiptGenerated) {
        onReceiptGenerated(res.fineRecord);
      }
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isHindi ? 'किताब वापस जमा करें (Return Book)' : 'Circulation Check-in — Return Book'}
      subtitle={
        isHindi
          ? 'किताब की जांच करें, लेट फीस (जुर्माना) का हिसाब लगाएं और किताब को वापस लाइब्रेरी में जमा करें।'
          : 'Verify book condition, calculate overdue fees, and restock inventory'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Loan Selection */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {isHindi ? 'कौन सी किताब जमा करनी है? (Select Issued Book) *' : 'Active Borrowed Loan *'}
            </label>
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              {isHindi ? 'QR / बारकोड स्कैन' : 'Scan Book / Patron QR'}
            </button>
          </div>
          <select
            value={selectedLoanId}
            onChange={(e) => setSelectedLoanId(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden bg-white"
          >
            <option value="">{isHindi ? '-- जारी की गई किताब चुनें --' : '-- Choose active checkout record --'}</option>
            {activeLoans.map((l) => (
              <option key={l.id} value={l.id}>
                "{l.bookTitle}" — {l.memberName} ({l.memberCode}) [{isHindi ? 'अंतिम तारीख:' : 'Due:'} {new Date(l.dueDate).toLocaleDateString()}]
              </option>
            ))}
          </select>
        </div>

        {/* Selected Loan Details */}
        {selectedLoan && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">{selectedLoan.bookTitle}</span>
              <Badge variant={selectedLoan.status === 'overdue' ? 'rose' : 'blue'}>
                {selectedLoan.status === 'overdue'
                  ? isHindi ? 'तय तारीख से लेट' : 'overdue'
                  : isHindi ? 'सामान्य जारी' : 'active'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  {isHindi ? 'छात्र / सदस्य' : 'Patron'}
                </span>
                <span className="font-semibold text-slate-800">{selectedLoan.memberName}</span>
                <span className="text-[10px] text-slate-400 block font-mono">{selectedLoan.memberCode}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  {isHindi ? 'अंतिम तारीख' : 'Due Date'}
                </span>
                <span className="font-semibold text-slate-800">
                  {new Date(selectedLoan.dueDate).toLocaleDateString()}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {isHindi ? 'जारी की गई:' : 'Issued'} {new Date(selectedLoan.issuedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Overdue Calculation Banner */}
        {fineCalculation.fineAmount > 0 ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-3">
            <div className="flex items-start gap-2 text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">
                  {isHindi ? 'किताब लेट होने का जुर्माना (Overdue Notice)' : 'Overdue Return Notice'}
                </h4>
                <p className="text-[11px] mt-0.5 leading-snug">
                  {isHindi
                    ? `यह किताब तय तारीख से ${fineCalculation.overdueDays} दिन लेट है (${settings.gracePeriodDays} दिन की छूट के बाद = ${fineCalculation.chargeableDays} दिन का चार्ज @ ${settings.currencySymbol}${settings.finePerDay.toFixed(2)}/दिन)।`
                    : `Loan is overdue by ${fineCalculation.overdueDays} days (${settings.gracePeriodDays} days grace period applied = ${fineCalculation.chargeableDays} billable days @ ${settings.currencySymbol}${settings.finePerDay.toFixed(2)}/day).`}
                </p>
                <p className="text-base font-extrabold text-rose-700 mt-1">
                  {isHindi ? 'कुल जुर्माना राशि:' : 'Accrued Fine:'} {settings.currencySymbol}{fineCalculation.fineAmount.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Payment settlement options */}
            <div className="pt-2 border-t border-rose-200/80 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={payFineNow}
                  onChange={(e) => setPayFineNow(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="font-bold text-slate-800 text-xs">
                  {isHindi
                    ? 'अभी छात्र से जुर्माना लेकर रसीद बनाएं (Collect Payment & Print Receipt)'
                    : 'Collect fine payment immediately and print receipt'}
                </span>
              </label>

              {payFineNow && (
                <div className="pl-6 pt-1">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    {isHindi ? 'भुगतान का तरीका (Payment Mode)' : 'Payment Method'}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 bg-white"
                  >
                    <option value="CASH">{isHindi ? 'नकद (Cash)' : 'Cash at Circulation Desk'}</option>
                    <option value="UPI">{isHindi ? 'UPI / QR कोड (Google Pay / PhonePe / Paytm)' : 'UPI / QR Code Transfer'}</option>
                    <option value="CARD">{isHindi ? 'डेबिट / क्रेडिट कार्ड' : 'Credit / Debit Card'}</option>
                    <option value="ONLINE">{isHindi ? 'छात्र पोर्टल से ऑनलाइन' : 'Student Portal Online Payment'}</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        ) : (
          selectedLoan && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">
                  {isHindi ? 'किताब समय पर वापस आई है।' : 'Returned on schedule.'}
                </span>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  {isHindi
                    ? 'किताब तय समय सीमा में जमा की गई है, कोई जुर्माना नहीं लगेगा।'
                    : 'Book is returned within the permitted loan period. No fines assessed.'}
                </p>
              </div>
            </div>
          )
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            {isHindi ? 'किताब की हालत व नोट (Condition Notes)' : 'Condition & Restock Notes'}
          </label>
          <input
            type="text"
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
            placeholder={isHindi ? 'जैसे: किताब सही हालत में है, अलमारी में रख दी गई' : 'e.g. In good condition, returned to shelf CS-Rack-01'}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
          />
        </div>

        {/* Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            {isHindi ? 'रद्द करें' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={!selectedLoanId}
            className={`px-5 py-2 text-xs sm:text-sm font-bold rounded-xl transition shadow-xs cursor-pointer ${
              selectedLoanId
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isHindi ? 'किताब वापस जमा करें (Confirm Return)' : 'Confirm Return'}
          </button>
        </div>
      </form>

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
        expectedType="ANY"
        title={isHindi ? 'किताब या छात्र ID कार्ड स्कैन करें' : 'Scan Book or Patron ID Barcode / QR'}
      />
    </Modal>
  );
};
