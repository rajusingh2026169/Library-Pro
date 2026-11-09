import React, { useState, useMemo } from 'react';
import {
  Repeat,
  Search,
  PlusCircle,
  CornerDownLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  User,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Loan } from '../../types';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface ActiveLoansListProps {
  onOpenIssueModal: () => void;
  onOpenReturnModal: (loanId?: string) => void;
}

export const ActiveLoansList: React.FC<ActiveLoansListProps> = ({
  onOpenIssueModal,
  onOpenReturnModal,
}) => {
  const { loans, settings, renewLoan, hasPermission, language } = useApp();
  const isHindi = language === 'hi';

  const [search, setSearch] = useState('');
  const [tabFilter, setTabFilter] = useState<'active' | 'overdue' | 'returned' | 'all'>('active');
  const [loanToRenew, setLoanToRenew] = useState<Loan | null>(null);

  const filteredLoans = useMemo(() => {
    return loans.filter((l) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        l.bookTitle.toLowerCase().includes(q) ||
        l.bookIsbn.toLowerCase().includes(q) ||
        l.memberName.toLowerCase().includes(q) ||
        l.memberCode.toLowerCase().includes(q);

      let matchTab = true;
      if (tabFilter === 'active') matchTab = l.status === 'active';
      else if (tabFilter === 'overdue') matchTab = l.status === 'overdue';
      else if (tabFilter === 'returned') matchTab = l.status === 'returned';

      return matchSearch && matchTab;
    });
  }, [loans, search, tabFilter]);

  const counts = useMemo(() => {
    const active = loans.filter((l) => l.status === 'active').length;
    const overdue = loans.filter((l) => l.status === 'overdue').length;
    const returned = loans.filter((l) => l.status === 'returned').length;
    return { active, overdue, returned, all: loans.length };
  }, [loans]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isHindi ? 'किताब देना और वापस लेना (Issue & Return System)' : 'Circulation & Loan Operations'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isHindi
              ? 'छात्रों को किताबें जारी करें, वापस जमा करें, समय बढ़ाएं और लेट फीस का हिसाब रखें।'
              : 'Process book checkouts, check-ins, loan term extensions, and overdue monitoring.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenReturnModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer active:scale-98"
          >
            <CornerDownLeft className="w-4 h-4 text-slate-500" />
            {isHindi ? 'किताब वापस लें (Return Book)' : 'Check-In / Return'}
          </button>
          <button
            onClick={onOpenIssueModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-xs cursor-pointer active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            {isHindi ? 'नई किताब दें (Issue Book)' : 'Issue Book'}
          </button>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isHindi
                ? 'छात्र का नाम, कोड (MEM-...), किताब का नाम या ISBN से खोजें...'
                : 'Search by patron name, member code (MEM-...), book title, or ISBN...'
            }
            className="w-full pl-10 pr-4 py-2 bg-slate-50 text-xs sm:text-sm rounded-xl border border-slate-200 focus:bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-hidden"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setTabFilter('active')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
              tabFilter === 'active' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {isHindi ? 'छात्रों के पास' : 'Active'} ({counts.active})
          </button>
          <button
            onClick={() => setTabFilter('overdue')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              tabFilter === 'overdue' ? 'bg-white text-rose-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {isHindi ? 'तय तारीख से लेट' : 'Overdue'} ({counts.overdue})
          </button>
          <button
            onClick={() => setTabFilter('returned')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
              tabFilter === 'returned' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {isHindi ? 'जमा की गई' : 'Returned'} ({counts.returned})
          </button>
          <button
            onClick={() => setTabFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
              tabFilter === 'all' ? 'bg-white text-slate-800 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {isHindi ? 'सभी रिकॉर्ड' : 'All History'} ({counts.all})
          </button>
        </div>
      </div>

      {/* Loans Table */}
      {filteredLoans.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title={isHindi ? 'कोई किताब रिकॉर्ड नहीं मिला' : 'No circulation loans found'}
          description={
            isHindi
              ? 'वर्तमान में कोई किताब इस श्रेणी में नहीं है।'
              : 'There are currently no records that match your search filters.'
          }
          actionLabel={isHindi ? 'नई किताब जारी करें' : 'Issue New Book'}
          onAction={onOpenIssueModal}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">{isHindi ? 'किताब का नाम व कोड' : 'Book Title & ISBN'}</th>
                  <th className="py-3 px-4">{isHindi ? 'छात्र / सदस्य' : 'Patron'}</th>
                  <th className="py-3 px-4">{isHindi ? 'जारी करने की तारीख' : 'Issue Date'}</th>
                  <th className="py-3 px-4">{isHindi ? 'अंतिम तारीख (Due Date)' : 'Due Date'}</th>
                  <th className="py-3 px-4">{isHindi ? 'रिन्यू' : 'Renewals'}</th>
                  <th className="py-3 px-4">{isHindi ? 'स्थिति व जुर्माना' : 'Status & Fine'}</th>
                  <th className="py-3 px-4 text-right">{isHindi ? 'कार्य' : 'Circulation Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLoans.map((loan) => (
                  <tr
                    key={loan.id}
                    className={`transition ${
                      loan.status === 'overdue' ? 'bg-rose-50/30 hover:bg-rose-50/60' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="max-w-xs">
                        <p className="font-bold text-slate-900 truncate">{loan.bookTitle}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ISBN: {loan.bookIsbn}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-slate-800">{loan.memberName}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">{loan.memberCode}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-slate-600">{new Date(loan.issuedAt).toLocaleDateString()}</span>
                      <span className="block text-[10px] text-slate-400">
                        {isHindi ? 'द्वारा:' : 'By'} {loan.issuedByUserName}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`font-semibold ${
                          loan.status === 'overdue' ? 'text-rose-600 font-bold' : 'text-slate-800'
                        }`}
                      >
                        {new Date(loan.dueDate).toLocaleDateString()}
                      </span>
                      {loan.returnedAt && (
                        <span className="block text-[10px] text-emerald-600">
                          {isHindi ? 'वापस जमा:' : 'Ret:'} {new Date(loan.returnedAt).toLocaleDateString()}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-semibold text-slate-700">
                        {loan.renewalCount} / {loan.maxRenewals}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col items-start gap-1">
                        <Badge
                          variant={
                            loan.status === 'overdue'
                              ? 'rose'
                              : loan.status === 'returned'
                              ? 'emerald'
                              : 'blue'
                          }
                        >
                          {loan.status === 'overdue'
                            ? isHindi ? 'लेट (Overdue)' : 'overdue'
                            : loan.status === 'returned'
                            ? isHindi ? 'वापस जमा' : 'returned'
                            : isHindi ? 'जारी (Active)' : 'active'}
                        </Badge>
                        {loan.fineAmount > 0 && (
                          <span className="text-[10px] font-bold text-rose-600 font-mono">
                            {isHindi ? 'जुर्माना:' : 'Fine:'} {settings.currencySymbol}{loan.fineAmount.toFixed(2)}{' '}
                            {loan.finePaid ? (isHindi ? '(जमा)' : '(Paid)') : (isHindi ? '(बाकी)' : '(Due)')}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {loan.status !== 'returned' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Renew button */}
                          <button
                            onClick={() => setLoanToRenew(loan)}
                            disabled={loan.renewalCount >= loan.maxRenewals}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              loan.renewalCount < loan.maxRenewals
                                ? 'text-indigo-600 hover:bg-indigo-50 border border-indigo-200'
                                : 'text-slate-300 border border-slate-200 cursor-not-allowed'
                            }`}
                            title={
                              loan.renewalCount >= loan.maxRenewals
                                ? isHindi ? 'अधिकतम रिन्यू सीमा समाप्त' : 'Max renewals reached'
                                : isHindi ? 'तारीख आगे बढ़ाएं (रिन्यू करें)' : 'Renew loan due date'
                            }
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          {/* Return button */}
                          <button
                            onClick={() => onOpenReturnModal(loan.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-xs cursor-pointer"
                          >
                            <CornerDownLeft className="w-3.5 h-3.5" />
                            {isHindi ? 'किताब वापस लें' : 'Return'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {isHindi ? 'जमा हो चुकी है' : 'Completed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Renew Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(loanToRenew)}
        onClose={() => setLoanToRenew(null)}
        onConfirm={() => {
          if (loanToRenew) renewLoan(loanToRenew.id);
        }}
        title={isHindi ? 'किताब जमा करने की तारीख आगे बढ़ाएं (रिन्यू करें)' : 'Extend Loan Term (Renewal)'}
        message={
          isHindi
            ? `क्या आप "${loanToRenew?.bookTitle}" के लिए छात्र ${loanToRenew?.memberName} की अंतिम तारीख ${settings.defaultLoanPeriodDays} दिन आगे बढ़ाना चाहते हैं? (रिन्यू नंबर #${(loanToRenew?.renewalCount || 0) + 1}/${settings.maxRenewalsAllowed})`
            : `Are you sure you want to renew "${loanToRenew?.bookTitle}" for ${loanToRenew?.memberName}? This will extend the due date by ${settings.defaultLoanPeriodDays} days (Renewal #${(loanToRenew?.renewalCount || 0) + 1}/${settings.maxRenewalsAllowed}).`
        }
        confirmLabel={isHindi ? 'हाँ, तारीख बढ़ाएं' : 'Confirm Renewal'}
        variant="primary"
      />
    </div>
  );
};
