import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Member, Loan, FineRecord } from '../../types';
import { Badge } from '../common/Badge';
import { useApp } from '../../context/AppContext';
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  AlertTriangle,
  BookOpen,
  Printer,
  CreditCard,
  Repeat,
  CheckCircle2,
} from 'lucide-react';

interface MemberDetailsModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onIssueBookToMember: (memberId: string) => void;
  onOpenCollectFine: (fine: FineRecord) => void;
}

export const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({
  member,
  isOpen,
  onClose,
  onIssueBookToMember,
  onOpenCollectFine,
}) => {
  const { loans, fines, settings, updateMemberStatus, hasPermission, language } = useApp();
  const isHindi = language === 'hi';
  const [activeTab, setActiveTab] = useState<'overview' | 'loans' | 'card'>('overview');

  if (!member) return null;

  const memberLoans = loans.filter((l) => l.memberId === member.id);
  const activeLoans = memberLoans.filter((l) => l.status === 'active' || l.status === 'overdue');
  const pastLoans = memberLoans.filter((l) => l.status === 'returned');
  const memberFines = fines.filter((f) => f.memberId === member.id);
  const pendingFines = memberFines.filter((f) => f.status === 'pending');

  const isExpired = new Date(member.expiryDate) < new Date();

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isHindi ? 'छात्र की पूरी जानकारी (Member Profile)' : 'Member Profile & Circulation History'}
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Tab switch */}
        <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            {isHindi ? 'सामान्य विवरण (Overview)' : 'Overview & Status'}
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`pb-2.5 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'loans'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            {isHindi ? `किताबों का रिकॉर्ड (${memberLoans.length})` : `Borrowing History (${memberLoans.length})`}
          </button>
          <button
            onClick={() => setActiveTab('card')}
            className={`pb-2.5 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'card'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            {isHindi ? 'डिजिटल लाइब्रेरी कार्ड (Card Pass)' : 'Library Card Pass'}
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Patron Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-indigo-100 border border-indigo-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-indigo-700 text-lg">
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt={member.fullName} className="w-full h-full object-cover" />
                  ) : (
                    member.fullName.charAt(0)
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">{member.fullName}</h3>
                    <Badge
                      variant={
                        member.status === 'active'
                          ? 'emerald'
                          : member.status === 'suspended'
                          ? 'rose'
                          : 'amber'
                      }
                    >
                      {member.status}
                    </Badge>
                  </div>
                  <p className="text-xs font-mono font-bold text-indigo-600 mt-0.5">
                    {member.memberCode} • <span className="uppercase">{member.memberType}</span>
                  </p>
                  <p className="text-xs text-slate-500">{member.department}</p>
                </div>
              </div>

              {/* Status toggles for staff */}
              {hasPermission('LIBRARIAN') && (
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Status:</span>
                  {(['active', 'suspended', 'expired'] as Member['status'][]).map((st) => (
                    <button
                      key={st}
                      onClick={() => updateMemberStatus(member.id, st)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase transition cursor-pointer ${
                        member.status === st
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {isHindi ? 'जारी किताबें (Current Loans)' : 'Current Loans'}
                </span>
                <p className="text-lg font-black text-slate-800 mt-0.5">
                  {activeLoans.length}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    / {member.maxLoansAllowed} {isHindi ? 'लिमिट' : 'limit'}
                  </span>
                </p>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  member.outstandingFines > 0
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <span className="text-[10px] font-bold uppercase opacity-70">
                  {isHindi ? 'बाकी जुर्माना (Dues)' : 'Outstanding Dues'}
                </span>
                <p className="text-lg font-black mt-0.5">
                  {settings.currencySymbol}{member.outstandingFines.toFixed(2)}
                </p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {isHindi ? 'कार्ड वैधता (Expiry)' : 'Expiry Date'}
                </span>
                <p className={`text-sm font-bold mt-1 ${isExpired ? 'text-rose-600' : 'text-slate-800'}`}>
                  {member.expiryDate} {isExpired && (isHindi ? '(तारीख समाप्त)' : '(Expired)')}
                </p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">{member.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{member.phone || 'No phone provided'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400" />
                <span>{member.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Joined {member.joinDate}</span>
              </div>
            </div>

            {/* Pending Fines Quick Pay */}
            {pendingFines.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Unpaid Overdue Fines ({pendingFines.length})
                  </div>
                </div>
                <div className="space-y-2">
                  {pendingFines.map((f) => (
                    <div key={f.id} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-amber-100">
                      <div>
                        <span className="font-semibold text-slate-800">{f.bookTitle}</span>
                        <span className="block text-[11px] text-slate-500">{f.reason}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-rose-600">
                          {settings.currencySymbol}{f.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => {
                            onClose();
                            onOpenCollectFine(f);
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 cursor-pointer"
                        >
                          Collect Payment
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Borrowing History */}
        {activeTab === 'loans' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Active Checkouts ({activeLoans.length})
              </h4>
              {activeLoans.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No active books currently borrowed.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {activeLoans.map((l) => (
                    <div key={l.id} className="p-3 bg-white flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{l.bookTitle}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Issued: {new Date(l.issuedAt).toLocaleDateString()} • Due:{' '}
                          <span className={l.status === 'overdue' ? 'text-rose-600 font-bold' : ''}>
                            {new Date(l.dueDate).toLocaleDateString()}
                          </span>
                        </p>
                      </div>
                      <Badge variant={l.status === 'overdue' ? 'rose' : 'blue'}>{l.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Returned Loan History ({pastLoans.length})
              </h4>
              {pastLoans.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No past returns recorded yet.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  {pastLoans.map((l) => (
                    <div key={l.id} className="p-3 bg-white flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{l.bookTitle}</p>
                        <p className="text-[11px] text-slate-400">
                          Returned: {l.returnedAt ? new Date(l.returnedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <Badge variant="emerald">Returned</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Printable Library Card */}
        {activeTab === 'card' && (
          <div className="flex flex-col items-center space-y-4 py-2">
            <div className="w-full max-w-md bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-indigo-400/20 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold tracking-tight">{settings.institutionName}</h3>
                  <p className="text-[10px] text-indigo-300 font-medium">{settings.libraryName}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase">
                  {member.memberType} Pass
                </span>
              </div>

              <div className="flex items-center gap-4 my-5">
                <div className="w-16 h-16 rounded-xl bg-indigo-100 overflow-hidden border-2 border-indigo-400/40 shrink-0">
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt={member.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-indigo-700 font-bold text-xl">
                      {member.fullName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-extrabold truncate text-white">{member.fullName}</h4>
                  <p className="text-xs text-indigo-200 truncate">{member.department}</p>
                  <p className="text-[11px] font-mono font-bold text-indigo-300 mt-1">{member.memberCode}</p>
                </div>
              </div>

              {/* Barcode representation */}
              <div className="pt-3 border-t border-indigo-400/20 flex flex-col items-center">
                <div className="h-9 w-4/5 bg-white/90 rounded px-2 flex items-center justify-between overflow-hidden">
                  {[4, 2, 5, 1, 3, 6, 2, 4, 1, 3, 5, 2, 4, 3, 5, 2, 3, 1, 4, 2, 5, 3].map((w, idx) => (
                    <div key={idx} className="bg-black h-full" style={{ width: `${w * 2}px` }} />
                  ))}
                </div>
                <span className="text-[9px] font-mono text-indigo-300 mt-1">
                  VALID THRU: {member.expiryDate}
                </span>
              </div>
            </div>

            <button
              onClick={handlePrintCard}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Patron Pass
            </button>
          </div>
        )}

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onIssueBookToMember(member.id);
            }}
            disabled={member.status !== 'active' || isExpired}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition shadow-xs cursor-pointer ${
              member.status === 'active' && !isExpired
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Issue Book to Patron
          </button>
        </div>
      </div>
    </Modal>
  );
};
