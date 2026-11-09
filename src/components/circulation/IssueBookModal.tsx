import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { CirculationService } from '../../services/circulationService';
import { Book, Member } from '../../types';
import { AlertCircle, CheckCircle2, Calendar, BookOpen, User, Info, QrCode } from 'lucide-react';
import { QRScannerModal, ScannedResult } from '../common/QRScannerModal';

interface IssueBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedBookId?: string;
  preselectedMemberId?: string;
}

export const IssueBookModal: React.FC<IssueBookModalProps> = ({
  isOpen,
  onClose,
  preselectedBookId,
  preselectedMemberId,
}) => {
  const { books, members, loans, settings, issueBook, language } = useApp();
  const isHindi = language === 'hi';

  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [customDueDate, setCustomDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState<'book' | 'member'>('book');

  const handleScan = (result: ScannedResult) => {
    const raw = (result.id || result.raw || '').trim().toLowerCase();
    if (scanTarget === 'book') {
      const found = books.find(
        (b) =>
          b.id.toLowerCase() === raw ||
          b.isbn.toLowerCase() === raw ||
          (result.data?.isbn && b.isbn.toLowerCase() === result.data.isbn.toLowerCase()) ||
          b.title.toLowerCase().includes(raw)
      );
      if (found) {
        setSelectedBookId(found.id);
        setIsScannerOpen(false);
      }
    } else {
      const found = members.find(
        (m) =>
          m.id.toLowerCase() === raw ||
          m.memberCode.toLowerCase() === raw ||
          m.fullName.toLowerCase().includes(raw)
      );
      if (found) {
        setSelectedMemberId(found.id);
        setIsScannerOpen(false);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedBookId(preselectedBookId || '');
      setSelectedMemberId(preselectedMemberId || '');
      setNotes('');
      // Compute default due date
      const due = CirculationService.calculateDueDate('student', settings);
      setCustomDueDate(due.toISOString().split('T')[0]);
    }
  }, [isOpen, preselectedBookId, preselectedMemberId, settings]);

  const selectedBook = useMemo(() => books.find((b) => b.id === selectedBookId), [books, selectedBookId]);
  const selectedMember = useMemo(() => members.find((m) => m.id === selectedMemberId), [members, selectedMemberId]);

  // When member changes, update due date based on their member type (e.g. faculty vs student)
  useEffect(() => {
    if (selectedMember) {
      const due = CirculationService.calculateDueDate(selectedMember.memberType, settings);
      setCustomDueDate(due.toISOString().split('T')[0]);
    }
  }, [selectedMember, settings]);

  // Check eligibility in real time
  const eligibility = useMemo(() => {
    if (!selectedBook || !selectedMember) return null;
    const activeMemberLoans = loans.filter(
      (l) => l.memberId === selectedMember.id && (l.status === 'active' || l.status === 'overdue')
    );
    return CirculationService.validateIssueEligibility(selectedBook, selectedMember, settings, activeMemberLoans);
  }, [selectedBook, selectedMember, loans, settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId || !selectedMemberId || !eligibility?.allowed) return;

    const res = issueBook(
      selectedBookId,
      selectedMemberId,
      customDueDate ? new Date(customDueDate).toISOString() : undefined,
      notes.trim()
    );

    if (res.success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isHindi ? 'किताब जारी करें (Issue Book to Student)' : 'Circulation Checkout — Issue Book'}
      subtitle={
        isHindi
          ? 'किताब चुनें, छात्र चुनें और वापस करने की अंतिम तारीख तय करके किताब दें।'
          : 'Validate patron eligibility, book copy availability, and set loan due date'
      }
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Book Selector */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {isHindi ? '1. किताब का नाम चुनें (Select Book) *' : 'Select Book Title *'}
            </label>
            <button
              type="button"
              onClick={() => {
                setScanTarget('book');
                setIsScannerOpen(true);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              {isHindi ? 'QR / बारकोड स्कैन करें' : 'Scan Book QR'}
            </button>
          </div>
          <select
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden bg-white"
          >
            <option value="">{isHindi ? '-- किताब चुनें --' : '-- Choose a cataloged book --'}</option>
            {books
              .filter((b) => b.status === 'available')
              .map((b) => (
                <option key={b.id} value={b.id} disabled={b.availableCopies <= 0}>
                  {b.title} (ISBN: {b.isbn}) — [{b.availableCopies} {isHindi ? 'उपलब्ध' : 'avail'} / {b.totalCopies} {isHindi ? 'कुल' : 'total'}]
                </option>
              ))}
          </select>
        </div>

        {/* Selected Book Summary Pill */}
        {selectedBook && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800">{selectedBook.title}</span>
                <span className="text-[11px] text-slate-500 block">
                  {isHindi ? 'लेखक:' : 'Author:'} {selectedBook.author} • {isHindi ? 'अलमारी:' : 'Shelf:'} {selectedBook.shelfNumber}
                </span>
              </div>
            </div>
            <span
              className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                selectedBook.availableCopies > 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {selectedBook.availableCopies} {isHindi ? 'उपलब्ध' : 'in stock'}
            </span>
          </div>
        )}

        {/* Member Selector */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {isHindi ? '2. छात्र या सदस्य चुनें (Select Patron) *' : 'Select Patron / Member *'}
            </label>
            <button
              type="button"
              onClick={() => {
                setScanTarget('member');
                setIsScannerOpen(true);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              {isHindi ? 'सदस्य ID स्कैन करें' : 'Scan Member QR'}
            </button>
          </div>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden bg-white"
          >
            <option value="">{isHindi ? '-- छात्र या सदस्य चुनें --' : '-- Choose a registered member --'}</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName} ({m.memberCode}) — [{m.memberType.toUpperCase()}] — {m.status.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Member Summary Pill */}
        {selectedMember && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800">{selectedMember.fullName}</span>
                <span className="text-[11px] text-slate-500 block">
                  {selectedMember.memberCode} • Loans: {selectedMember.currentLoansCount}/{selectedMember.maxLoansAllowed}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  selectedMember.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {selectedMember.status}
              </span>
              {selectedMember.outstandingFines > 0 && (
                <span className="block text-[10px] font-bold text-rose-600 mt-0.5">
                  Dues: {settings.currencySymbol}{selectedMember.outstandingFines.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Real-time Eligibility Warning / Approval Banner */}
        {eligibility && (
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
              eligibility.allowed
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {eligibility.allowed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">
                    {isHindi ? 'छात्र किताब लेने के लिए योग्य है।' : 'Patron is eligible to borrow.'}
                  </span>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    {isHindi
                      ? `कोई बाकी जुर्माना नहीं, लिमिट के अंदर (${selectedMember?.currentLoansCount}/${selectedMember?.maxLoansAllowed}), और किताब स्टॉक में उपलब्ध है।`
                      : `No conflicting dues, within active loan quota (${selectedMember?.currentLoansCount}/${selectedMember?.maxLoansAllowed}), copy is available.`}
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">
                    {isHindi ? 'किताब जारी नहीं की जा सकती (रोक)' : 'Checkout Not Allowed'}
                  </span>
                  <p className="text-[11px] opacity-90 mt-0.5">{eligibility.reason}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Due Date & Loan Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? '3. वापस करने की अंतिम तारीख (Due Date) *' : 'Due Date *'}
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={customDueDate}
                onChange={(e) => setCustomDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden bg-white"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {isHindi
                ? `नियम अनुसार: ${selectedMember?.memberType === 'faculty' ? settings.facultyLoanPeriodDays : settings.defaultLoanPeriodDays} दिनों की अनुमति`
                : `Default policy: ${selectedMember?.memberType === 'faculty' ? settings.facultyLoanPeriodDays : settings.defaultLoanPeriodDays} days.`}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'अतिरिक्त नोट (वैकल्पिक)' : 'Checkout Notes (Optional)'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isHindi ? 'जैसे: प्रोजेक्ट या असाइनमेंट के लिए' : 'e.g. Issued for lab assignment'}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
            />
          </div>
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
            disabled={!selectedBookId || !selectedMemberId || eligibility?.allowed === false}
            className={`px-5 py-2 text-xs sm:text-sm font-bold rounded-xl transition shadow-xs cursor-pointer ${
              selectedBookId && selectedMemberId && eligibility?.allowed
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isHindi ? 'किताब जारी करें (Confirm Issue)' : 'Confirm Issue'}
          </button>
        </div>
      </form>

      {/* QR Scanner Modal for Book / Patron Barcode */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
        expectedType={scanTarget === 'book' ? 'BOOK' : 'MEMBER'}
        title={
          scanTarget === 'book'
            ? isHindi
              ? 'किताब का QR / बारकोड स्कैन करें'
              : 'Scan Book QR / Barcode'
            : isHindi
            ? 'छात्र कार्ड / सदस्य QR स्कैन करें'
            : 'Scan Patron / Member QR'
        }
      />
    </Modal>
  );
};
