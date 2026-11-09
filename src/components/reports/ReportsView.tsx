import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
  BookOpen,
  Users,
  Repeat,
  AlertTriangle,
  Receipt,
  Calendar,
  FileText,
  Armchair,
  Building2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useReadingRoom } from '../../context/ReadingRoomContext';
import { Badge } from '../common/Badge';
import { PrintableReportModal, ReportType } from './PrintableReportModal';

export const ReportsView: React.FC = () => {
  const { books, members, loans, fines, settings, language, currentUser } = useApp();
  const { students, seats, plans } = useReadingRoom();
  const isHindi = language === 'hi';

  const [reportType, setReportType] = useState<ReportType>('circulation');
  const [dateFilter, setDateFilter] = useState<'30days' | '90days' | 'all'>('all');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Export to CSV function
  const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    if (reportType === 'circulation') {
      const headers = ['Loan ID', 'Book Title', 'ISBN', 'Patron Name', 'Member Code', 'Issue Date', 'Due Date', 'Return Date', 'Status', 'Fine'];
      const rows = loans.map((l) => [
        l.id,
        l.bookTitle,
        l.bookIsbn,
        l.memberName,
        l.memberCode,
        new Date(l.issuedAt).toLocaleDateString(),
        new Date(l.dueDate).toLocaleDateString(),
        l.returnedAt ? new Date(l.returnedAt).toLocaleDateString() : 'N/A',
        l.status,
        `${settings.currencySymbol}${l.fineAmount.toFixed(2)}`,
      ]);
      exportToCSV('circulation_report', headers, rows);
    } else if (reportType === 'inventory') {
      const headers = ['Book ID', 'Title', 'ISBN', 'Author', 'Category', 'Shelf', 'Total Copies', 'Available', 'Status'];
      const rows = books.map((b) => [
        b.id,
        b.title,
        b.isbn,
        b.author,
        b.category,
        b.shelfNumber,
        b.totalCopies,
        b.availableCopies,
        b.status,
      ]);
      exportToCSV('inventory_report', headers, rows);
    } else if (reportType === 'overdue') {
      const headers = ['Loan ID', 'Book Title', 'Patron', 'Member Code', 'Email', 'Due Date', 'Days Overdue', 'Accrued Fine'];
      const overdue = loans.filter((l) => l.status === 'overdue');
      const rows = overdue.map((l) => [
        l.id,
        l.bookTitle,
        l.memberName,
        l.memberCode,
        l.memberEmail,
        new Date(l.dueDate).toLocaleDateString(),
        Math.ceil((new Date().getTime() - new Date(l.dueDate).getTime()) / (1000 * 60 * 60 * 24)),
        `${settings.currencySymbol}${l.fineAmount.toFixed(2)}`,
      ]);
      exportToCSV('overdue_loans_report', headers, rows);
    } else if (reportType === 'members') {
      const headers = ['Member ID', 'Code', 'Full Name', 'Email', 'Type', 'Department', 'Active Loans', 'Outstanding Fines', 'Status', 'Expiry'];
      const rows = members.map((m) => [
        m.id,
        m.memberCode,
        m.fullName,
        m.email,
        m.memberType,
        m.department,
        m.currentLoansCount,
        `${settings.currencySymbol}${m.outstandingFines.toFixed(2)}`,
        m.status,
        m.expiryDate,
      ]);
      exportToCSV('patron_directory_report', headers, rows);
    } else if (reportType === 'fines') {
      const headers = ['Fine ID', 'Receipt #', 'Patron', 'Code', 'Book Title', 'Amount', 'Status', 'Date Assessed', 'Date Paid', 'Method'];
      const rows = fines.map((f) => [
        f.id,
        f.receiptNumber || 'N/A',
        f.memberName,
        f.memberCode,
        f.bookTitle,
        `${settings.currencySymbol}${f.amount.toFixed(2)}`,
        f.status,
        new Date(f.createdAt).toLocaleDateString(),
        f.paidAt ? new Date(f.paidAt).toLocaleDateString() : 'N/A',
        f.paymentMethod || 'N/A',
      ]);
      exportToCSV('fines_financial_report', headers, rows);
    } else if (reportType === 'reading_room') {
      const headers = ['Student ID', 'Full Name', 'Mobile', 'Seat #', 'Shift', 'Plan', 'Fee Status', 'Joining Date', 'Membership End'];
      const rows = students.map((s) => [
        s.studentId,
        s.name,
        s.mobile,
        s.allottedSeatNumber || 'Unallotted',
        s.shift,
        s.planName,
        s.dueAmount <= 0 ? 'PAID' : `DUE (${settings.currencySymbol}${s.dueAmount})`,
        s.joiningDate,
        s.expiryDate || 'N/A',
      ]);
      exportToCSV('reading_room_register', headers, rows);
    }
  };

  const overdueLoans = useMemo(() => loans.filter((l) => l.status === 'overdue'), [loans]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and Export Tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isHindi ? 'लाइब्रेरी एनालिटिक्स एवं रिपोर्ट' : 'Library Analytics & Compliance Reports'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isHindi
              ? 'पुस्तकालय सूची, छात्र बकाया, संचलन रिकॉर्ड एवं वित्तीय रिपोर्ट देखें व PDF में निकालें।'
              : 'Audit catalog inventory, patron delinquency, circulation volume, and revenue streams.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Main Action: Export Printable PDF Report */}
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-md shadow-indigo-600/20 cursor-pointer active:scale-98"
          >
            <FileText className="w-4 h-4" />
            {isHindi ? 'PDF रिपोर्ट निकालें / प्रिंट करें' : 'Export Printable PDF Report'}
          </button>

          {/* Quick Print Button */}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            title="Quick Print Current Screen"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            {isHindi ? 'सीधा प्रिंट' : 'Print View'}
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer active:scale-98"
          >
            <Download className="w-4 h-4 text-slate-500" />
            {isHindi ? 'CSV डाउनलोड' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Report Selector Pills */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-semibold no-print">
        <button
          onClick={() => setReportType('circulation')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer ${
            reportType === 'circulation' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Repeat className="w-4 h-4" />
          {isHindi ? 'संचलन इतिहास' : 'Circulation History'}
        </button>

        <button
          onClick={() => setReportType('inventory')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer ${
            reportType === 'inventory' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          {isHindi ? 'किताब सूची (Inventory)' : 'Catalog Inventory'}
        </button>

        <button
          onClick={() => setReportType('overdue')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer ${
            reportType === 'overdue' ? 'bg-white text-rose-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          {isHindi ? 'तय तारीख से लेट' : 'Overdue Delinquency'} ({overdueLoans.length})
        </button>

        <button
          onClick={() => setReportType('members')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer ${
            reportType === 'members' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          {isHindi ? 'सदस्य सूची' : 'Patron Directory'}
        </button>

        <button
          onClick={() => setReportType('fines')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer ${
            reportType === 'fines' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          {isHindi ? 'जुर्माना एवं रसीद' : 'Fines & Receipts'}
        </button>

        <button
          onClick={() => setReportType('reading_room')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer ${
            reportType === 'reading_room' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Armchair className="w-4 h-4" />
          {isHindi ? 'रीडिंग रूम रजिस्टर' : 'Reading Room Register'}
        </button>
      </div>

      {/* Print-Only Official Letterhead Header (when directly printed via browser native print) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase">
              {settings.institutionName || 'CENTRAL HIGHER ACADEMIC INSTITUTION'}
            </h1>
            <h2 className="text-sm font-bold text-indigo-900">
              {settings.libraryName || 'CENTRAL LIBRARY & INFORMATION RESOURCE CENTER'}
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {settings.address || 'University Campus'} • {settings.email} • {settings.phone}
            </p>
          </div>
          <div className="text-right text-[10px] text-slate-600">
            <span className="font-bold uppercase tracking-wider block text-slate-900">OFFICIAL AUDIT REPORT</span>
            <p>Printed: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
            <p>Auditor: {currentUser.displayName} ({currentUser.role})</p>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between font-bold text-xs uppercase text-slate-800">
          <span>Active View: {reportType.toUpperCase()} REPORT</span>
          <span>Certified Institutional Copy</span>
        </div>
      </div>

      {/* Active Report Table Render */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Circulation History Report */}
        {reportType === 'circulation' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Patron</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Return Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Staff Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">{l.bookTitle}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{l.memberName} ({l.memberCode})</td>
                    <td className="py-3 px-4">{new Date(l.issuedAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{new Date(l.dueDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{l.returnedAt ? new Date(l.returnedAt).toLocaleDateString() : '—'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={l.status === 'returned' ? 'emerald' : l.status === 'overdue' ? 'rose' : 'blue'}>
                        {l.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{l.issuedByUserName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Inventory Report */}
        {reportType === 'inventory' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Title & Author</th>
                  <th className="py-3 px-4">ISBN</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Shelf Location</th>
                  <th className="py-3 px-4">Total Copies</th>
                  <th className="py-3 px-4">Available</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {books.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {b.title}
                      <span className="block text-[11px] text-slate-400 font-normal">{b.author}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{b.isbn}</td>
                    <td className="py-3 px-4">{b.category}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{b.shelfNumber}</td>
                    <td className="py-3 px-4 font-mono">{b.totalCopies}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">{b.availableCopies}</td>
                    <td className="py-3 px-4">
                      <Badge variant={b.status === 'available' ? 'emerald' : 'slate'}>{b.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Overdue Delinquency Report */}
        {reportType === 'overdue' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Patron Name</th>
                  <th className="py-3 px-4">Member Code & Email</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Days Overdue</th>
                  <th className="py-3 px-4">Accrued Fine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueLoans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No overdue books on record!
                    </td>
                  </tr>
                ) : (
                  overdueLoans.map((l) => (
                    <tr key={l.id} className="hover:bg-rose-50/40">
                      <td className="py-3 px-4 font-bold text-slate-900">{l.bookTitle}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{l.memberName}</td>
                      <td className="py-3 px-4 font-mono">
                        {l.memberCode}
                        <span className="block text-[10px] text-slate-400">{l.memberEmail}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-rose-600">{new Date(l.dueDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-700">
                        {Math.ceil((new Date().getTime() - new Date(l.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-rose-700">
                        {settings.currencySymbol}{l.fineAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Patron Directory Report */}
        {reportType === 'members' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Member Code</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Active Loans</th>
                  <th className="py-3 px-4">Fines Due</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{m.memberCode}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{m.fullName}</td>
                    <td className="py-3 px-4 uppercase text-[10px] font-bold">{m.memberType}</td>
                    <td className="py-3 px-4 text-slate-500">{m.department}</td>
                    <td className="py-3 px-4 font-mono">{m.currentLoansCount} / {m.maxLoansAllowed}</td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-600">
                      {settings.currencySymbol}{m.outstandingFines.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={m.status === 'active' ? 'emerald' : 'rose'}>{m.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Fines Financial Report */}
        {reportType === 'fines' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Patron Name</th>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Fee Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Settled At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fines.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{f.receiptNumber || '—'}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{f.memberName}</td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{f.bookTitle}</td>
                    <td className="py-3 px-4 font-mono font-black text-slate-900">
                      {settings.currencySymbol}{f.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={f.status === 'paid' ? 'emerald' : f.status === 'pending' ? 'rose' : 'slate'}>
                        {f.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-500">
                      {f.paymentMethod || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {f.paidAt ? new Date(f.paidAt).toLocaleDateString() : 'Unpaid'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Reading Room Register Report */}
        {reportType === 'reading_room' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Student ID & Name</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Allotted Seat</th>
                  <th className="py-3 px-4">Shift</th>
                  <th className="py-3 px-4">Plan Name</th>
                  <th className="py-3 px-4">Fee Status</th>
                  <th className="py-3 px-4">Admission Date</th>
                  <th className="py-3 px-4">Membership Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {s.name}
                      <span className="block text-[10px] font-mono text-indigo-700 font-bold">{s.studentId}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{s.mobile}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-800">
                      {s.allottedSeatNumber || 'Unallotted'}
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-600">{s.shift}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{s.planName}</td>
                    <td className="py-3 px-4">
                      <Badge variant={s.dueAmount <= 0 ? 'emerald' : 'rose'}>
                        {s.dueAmount <= 0 ? 'PAID' : `DUE (${settings.currencySymbol}${s.dueAmount.toFixed(0)})`}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{new Date(s.joiningDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {s.expiryDate ? new Date(s.expiryDate).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable PDF Report Modal */}
      <PrintableReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        reportType={reportType}
        dateFilter={dateFilter}
      />
    </div>
  );
};
