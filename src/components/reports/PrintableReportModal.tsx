import React, { useState } from 'react';
import {
  Printer,
  X,
  FileText,
  Building2,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  BookOpen,
  Users,
  Repeat,
  Download,
  ShieldCheck,
  Check,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useReadingRoom } from '../../context/ReadingRoomContext';

export type ReportType = 'circulation' | 'inventory' | 'overdue' | 'members' | 'fines' | 'reading_room';

interface PrintableReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: ReportType;
  dateFilter: '30days' | '90days' | 'all';
}

export const PrintableReportModal: React.FC<PrintableReportModalProps> = ({
  isOpen,
  onClose,
  reportType,
  dateFilter,
}) => {
  const { books, members, loans, fines, settings, currentUser, language } = useApp();
  const { students, seats, plans, payments } = useReadingRoom();
  const isHindi = language === 'hi';

  // Configurable options for the printable PDF
  const defaultTitle = () => {
    switch (reportType) {
      case 'circulation':
        return isHindi ? 'पुस्तकालय संचलन एवं ऋण लेखा परीक्षण रिपोर्ट' : 'Official Library Circulation & Loan Audit Report';
      case 'inventory':
        return isHindi ? 'पुस्तकालय सूची एवं भौतिक स्टॉक सत्यापन रिपोर्ट' : 'Comprehensive Catalog Inventory & Stock Audit Report';
      case 'overdue':
        return isHindi ? 'विलंबित पुस्तकें एवं बकाया जुर्माना वसूली रिपोर्ट' : 'Overdue Books Delinquency & Penalty Statement';
      case 'members':
        return isHindi ? 'पंजीकृत छात्र एवं संकाय सदस्य निर्देशिका रिपोर्ट' : 'Registered Patrons, Students & Faculty Directory';
      case 'fines':
        return isHindi ? 'वित्तीय जुर्माना संग्रह एवं रसीद रिपोर्ट' : 'Financial Penalty Collection & Revenue Audit Report';
      case 'reading_room':
        return isHindi ? 'रीडिंग रूम छात्र एवं सीट आवंटन रजिस्टर' : 'Reading Room Student Admission & Seat Allocation Register';
    }
  };

  const [customTitle, setCustomTitle] = useState(defaultTitle());
  const [remarksNote, setRemarksNote] = useState(
    isHindi
      ? 'यह रिपोर्ट लाइब्रेरी मैनेजमेंट सिस्टम द्वारा सत्यापित डेटा से तैयार की गई है। किसी भी विसंगति के लिए 7 कार्य दिवसों के भीतर संपर्क करें।'
      : 'This official report is extracted from the LibraryPro management database. All verified records comply with standard circulation guidelines.'
  );
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [includeKpis, setIncludeKpis] = useState(true);
  const [includeRemarks, setIncludeRemarks] = useState(true);

  // Update title when reportType changes
  React.useEffect(() => {
    setCustomTitle(defaultTitle());
  }, [reportType, language]);

  if (!isOpen) return null;

  // Filtered collections
  const overdueLoans = loans.filter((l) => l.status === 'overdue');
  const activeLoans = loans.filter((l) => l.status === 'active' || l.status === 'overdue');
  const totalFineCollected = fines
    .filter((f) => f.status === 'paid')
    .reduce((sum, f) => sum + f.amount, 0);
  const totalFinePending = fines
    .filter((f) => f.status === 'pending')
    .reduce((sum, f) => sum + f.amount, 0);

  const documentRefNumber = `LIB-REP-${reportType.substring(0, 3).toUpperCase()}-${new Date().getFullYear()}${String(
    new Date().getMonth() + 1
  ).padStart(2, '0')}-${new Date().getDate()}-${Math.floor(100 + Math.random() * 900)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-start justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 print:my-0 print:border-none print:shadow-none print:rounded-none">
        {/* Top Control Toolbar (Hidden in Print) */}
        <div className="no-print bg-slate-900 text-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                {isHindi ? 'प्रिंट करने योग्य PDF रिपोर्ट जेनरेटर' : 'Printable PDF Report Generator'}
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Native Browser Print
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                {isHindi
                  ? 'ब्राउज़र के प्रिंट विकल्प से सीधे PDF सेव करें या प्रिंटर पर भेजें।'
                  : 'Save directly as publication-ready PDF or print using browser native dialog.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-98"
            >
              <Printer className="w-4 h-4" />
              {isHindi ? 'PDF सेव करें / प्रिंट करें' : 'Print / Save as PDF'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Options Customizer Bar (Hidden in Print) */}
        <div className="no-print bg-slate-50 border-b border-slate-200 p-4 text-xs space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                {isHindi ? 'रिपोर्ट का शीर्षक (Document Title)' : 'Report Document Title'}
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white font-medium text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                {isHindi ? 'नोट्स व आधिकारिक निर्देश (Official Remarks)' : 'Official Audit Notes / Remarks'}
              </label>
              <input
                type="text"
                value={remarksNote}
                onChange={(e) => setRemarksNote(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={includeKpis}
                  onChange={(e) => setIncludeKpis(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                {isHindi ? 'KPI सारांश कार्ड शामिल करें' : 'Include Executive Summary KPIs'}
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={includeRemarks}
                  onChange={(e) => setIncludeRemarks(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                {isHindi ? 'आधिकारिक नोट शामिल करें' : 'Include Notes / Remarks'}
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={includeSignatures}
                  onChange={(e) => setIncludeSignatures(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                {isHindi ? 'हस्ताक्षर व मुहर ब्लॉक शामिल करें' : 'Include Signatures & Seal Block'}
              </label>
            </div>

            <div className="text-[11px] text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 flex items-center gap-1.5 font-medium">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>
                {isHindi
                  ? 'प्रिंट विंडो में Destination: "Save as PDF" चुनें।'
                  : 'In print window, set Destination to "Save as PDF".'}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PRINTABLE REPORT DOCUMENT CONTAINER (Visible on Screen & Print) */}
        {/* ============================================================== */}
        <div id="printable-report-area" className="p-6 sm:p-10 bg-white text-slate-900 text-xs font-sans">
          {/* Institutional Letterhead Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shrink-0 print:border print:border-slate-800">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase leading-tight">
                    {settings.institutionName || 'CENTRAL HIGHER EDUCATION & ACADEMIC INSTITUTION'}
                  </h1>
                  <h2 className="text-sm font-bold text-indigo-800 tracking-wide mt-0.5">
                    {settings.libraryName || 'CENTRAL LIBRARY & LEARNING RESOURCE CENTER'}
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {settings.address || 'Knowledge Campus, University Road'} • {settings.email} • {settings.phone}
                    {settings.branchCode && ` • Branch: ${settings.branchCode}`}
                  </p>
                </div>
              </div>

              {/* Document Metadata Box */}
              <div className="text-right border-l-2 sm:border-l-0 sm:pl-0 pl-3 border-indigo-600 shrink-0">
                <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-slate-900 text-white rounded mb-1">
                  OFFICIAL AUDIT REPORT
                </span>
                <p className="font-mono text-[11px] font-bold text-slate-800">Ref: {documentRefNumber}</p>
                <p className="text-[10px] text-slate-500">
                  Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </p>
                <p className="text-[10px] text-slate-600 font-medium">
                  Prepared By: {currentUser.displayName} ({currentUser.role})
                </p>
              </div>
            </div>
          </div>

          {/* Document Title Banner */}
          <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-300 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                {customTitle}
              </h3>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                {isHindi ? 'सिस्टम डेटाबेस से प्रमाणित प्रति' : 'Certified Official Extract from System Database'} •{' '}
                {isHindi ? 'अवधि:' : 'Date Scope:'} {dateFilter === 'all' ? 'All Time Historical' : dateFilter}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="font-mono text-xs font-bold text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                Total Records:{' '}
                {reportType === 'circulation'
                  ? loans.length
                  : reportType === 'inventory'
                  ? books.length
                  : reportType === 'overdue'
                  ? overdueLoans.length
                  : reportType === 'members'
                  ? members.length
                  : reportType === 'fines'
                  ? fines.length
                  : students.length}
              </span>
            </div>
          </div>

          {/* Executive Summary KPIs Strip (Optional) */}
          {includeKpis && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {reportType === 'circulation' && (
                <>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Checkouts</span>
                    <span className="text-lg font-black text-slate-900 font-mono">{loans.length}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Active Loans</span>
                    <span className="text-lg font-black text-indigo-700 font-mono">{activeLoans.length}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Returned On-time</span>
                    <span className="text-lg font-black text-emerald-700 font-mono">
                      {loans.filter((l) => l.status === 'returned').length}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Overdue Delinquency</span>
                    <span className="text-lg font-black text-rose-700 font-mono">{overdueLoans.length}</span>
                  </div>
                </>
              )}

              {reportType === 'inventory' && (
                <>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Book Titles</span>
                    <span className="text-lg font-black text-slate-900 font-mono">{books.length}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Catalog Volumes</span>
                    <span className="text-lg font-black text-indigo-700 font-mono">
                      {books.reduce((acc, b) => acc + (b.totalCopies || 0), 0)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Available on Shelf</span>
                    <span className="text-lg font-black text-emerald-700 font-mono">
                      {books.reduce((acc, b) => acc + (b.availableCopies || 0), 0)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Currently Checked Out</span>
                    <span className="text-lg font-black text-amber-700 font-mono">
                      {books.reduce((acc, b) => acc + Math.max(0, (b.totalCopies || 0) - (b.availableCopies || 0)), 0)}
                    </span>
                  </div>
                </>
              )}

              {reportType === 'overdue' && (
                <>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Delinquent Loans</span>
                    <span className="text-lg font-black text-rose-700 font-mono">{overdueLoans.length}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Accrued Penalty</span>
                    <span className="text-lg font-black text-rose-700 font-mono">
                      {settings.currencySymbol}
                      {overdueLoans.reduce((sum, l) => sum + l.fineAmount, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Penalty Rate Per Day</span>
                    <span className="text-lg font-black text-slate-900 font-mono">
                      {settings.currencySymbol}
                      {settings.finePerDay.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Grace Period</span>
                    <span className="text-lg font-black text-indigo-700 font-mono">
                      {settings.gracePeriodDays} Days
                    </span>
                  </div>
                </>
              )}

              {reportType === 'members' && (
                <>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Registered</span>
                    <span className="text-lg font-black text-slate-900 font-mono">{members.length}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Active Status</span>
                    <span className="text-lg font-black text-emerald-700 font-mono">
                      {members.filter((m) => m.status === 'active').length}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Student Patrons</span>
                    <span className="text-lg font-black text-indigo-700 font-mono">
                      {members.filter((m) => m.memberType === 'student').length}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Patrons with Dues</span>
                    <span className="text-lg font-black text-rose-700 font-mono">
                      {members.filter((m) => m.outstandingFines > 0).length}
                    </span>
                  </div>
                </>
              )}

              {reportType === 'fines' && (
                <>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Assessments</span>
                    <span className="text-lg font-black text-slate-900 font-mono">{fines.length}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Collected Revenue</span>
                    <span className="text-lg font-black text-emerald-700 font-mono">
                      {settings.currencySymbol}
                      {totalFineCollected.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Outstanding Due</span>
                    <span className="text-lg font-black text-rose-700 font-mono">
                      {settings.currencySymbol}
                      {totalFinePending.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Settlement Ratio</span>
                    <span className="text-lg font-black text-indigo-700 font-mono">
                      {fines.length > 0
                        ? `${Math.round(
                            (fines.filter((f) => f.status === 'paid').length / fines.length) * 100
                          )}%`
                        : '0%'}
                    </span>
                  </div>
                </>
              )}

              {reportType === 'reading_room' && (
                <>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Enrolled</span>
                    <span className="text-lg font-black text-slate-900 font-mono">{students.length}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Active Students</span>
                    <span className="text-lg font-black text-emerald-700 font-mono">
                      {students.filter((s) => s.status === 'active').length}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Occupied Seats</span>
                    <span className="text-lg font-black text-indigo-700 font-mono">
                      {seats.filter((st) => st.status === 'occupied').length} / {seats.length}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Fee Dues Count</span>
                    <span className="text-lg font-black text-rose-700 font-mono">
                      {students.filter((s) => s.dueAmount > 0).length}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* DATA TABLE (Crisp high-contrast print typography) */}
          {/* ============================================================== */}
          <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
            {/* 1. Circulation Report Table */}
            {reportType === 'circulation' && (
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-slate-200 text-slate-800 font-black uppercase text-[10px] border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-slate-300 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Book Title & ISBN</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Patron Name & Code</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Issue Date</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Due Date</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Return Date</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Fine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loans.map((l, idx) => (
                    <tr key={l.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-center text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">
                        {l.bookTitle}
                        <span className="block text-[10px] font-mono text-slate-500 font-normal">
                          ISBN: {l.bookIsbn}
                        </span>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-800">
                        {l.memberName}
                        <span className="block text-[10px] font-mono text-indigo-700 font-bold">
                          {l.memberCode}
                        </span>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200">
                        {new Date(l.issuedAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-medium text-slate-900">
                        {new Date(l.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200">
                        {l.returnedAt ? new Date(l.returnedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                            l.status === 'returned'
                              ? 'border-emerald-600 text-emerald-800 bg-emerald-50'
                              : l.status === 'overdue'
                              ? 'border-rose-600 text-rose-800 bg-rose-50'
                              : 'border-blue-600 text-blue-800 bg-blue-50'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {settings.currencySymbol}
                        {l.fineAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                  <tr>
                    <td colSpan={7} className="py-2 px-3 text-right text-slate-700">
                      Total Circulation Volume:
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
                      {settings.currencySymbol}
                      {loans.reduce((sum, l) => sum + l.fineAmount, 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}

            {/* 2. Inventory Report Table */}
            {reportType === 'inventory' && (
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-slate-200 text-slate-800 font-black uppercase text-[10px] border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-slate-300 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Book Title & Author</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">ISBN</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Category</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Shelf Location</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 text-center">Total</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 text-center">Available</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {books.map((b, idx) => (
                    <tr key={b.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-center text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">
                        {b.title}
                        <span className="block text-[10px] font-normal text-slate-500">By {b.author}</span>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-700">{b.isbn}</td>
                      <td className="py-2 px-3 border-r border-slate-200">{b.category}</td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-indigo-800">
                        {b.shelfNumber}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-center font-bold">
                        {b.totalCopies}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-center font-bold text-emerald-800">
                        {b.availableCopies}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                            b.status === 'available'
                              ? 'border-emerald-600 text-emerald-800 bg-emerald-50'
                              : 'border-slate-500 text-slate-700 bg-slate-50'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                  <tr>
                    <td colSpan={5} className="py-2 px-3 text-right text-slate-700">
                      Total Volumes in Inventory:
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-black text-slate-900">
                      {books.reduce((acc, b) => acc + (b.totalCopies || 0), 0)}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-black text-emerald-800">
                      {books.reduce((acc, b) => acc + (b.availableCopies || 0), 0)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}

            {/* 3. Overdue Delinquency Report Table */}
            {reportType === 'overdue' && (
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-slate-200 text-slate-800 font-black uppercase text-[10px] border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-slate-300 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Book Title</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Patron Name & Code</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Email & Contact</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Due Date</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 text-center">Days Overdue</th>
                    <th className="py-2.5 px-3 text-right">Fine Accrued</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {overdueLoans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500 font-medium">
                        No overdue book delinquencies on record! All books are accounted for.
                      </td>
                    </tr>
                  ) : (
                    overdueLoans.map((l, idx) => {
                      const daysOver = Math.ceil(
                        (new Date().getTime() - new Date(l.dueDate).getTime()) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <tr key={l.id} className={idx % 2 === 1 ? 'bg-rose-50/40' : 'bg-white'}>
                          <td className="py-2 px-3 border-r border-slate-200 font-mono text-center text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">
                            {l.bookTitle}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-800">
                            {l.memberName}
                            <span className="block text-[10px] font-mono text-indigo-700 font-bold">
                              {l.memberCode}
                            </span>
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-600 font-mono text-[10px]">
                            {l.memberEmail}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 font-bold text-rose-700">
                            {new Date(l.dueDate).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-center text-rose-700">
                            {daysOver} Days
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-black text-rose-700">
                            {settings.currencySymbol}
                            {l.fineAmount.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                  <tr>
                    <td colSpan={6} className="py-2 px-3 text-right text-slate-700">
                      Total Overdue Penalties Outstanding:
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-black text-rose-700">
                      {settings.currencySymbol}
                      {overdueLoans.reduce((sum, l) => sum + l.fineAmount, 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}

            {/* 4. Patron Directory Report Table */}
            {reportType === 'members' && (
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-slate-200 text-slate-800 font-black uppercase text-[10px] border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-slate-300 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Member Code</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Full Name</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Patron Type</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Department</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 text-center">Active Loans</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 text-right">Outstanding Dues</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {members.map((m, idx) => (
                    <tr key={m.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-center text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-indigo-800">
                        {m.memberCode}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">
                        {m.fullName}
                        <span className="block text-[10px] text-slate-500 font-normal">{m.email}</span>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 uppercase text-[10px] font-bold text-slate-700">
                        {m.memberType}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200">{m.department}</td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-center">
                        {m.currentLoansCount} / {m.maxLoansAllowed}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-bold text-rose-700">
                        {settings.currencySymbol}
                        {m.outstandingFines.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                            m.status === 'active'
                              ? 'border-emerald-600 text-emerald-800 bg-emerald-50'
                              : 'border-rose-600 text-rose-800 bg-rose-50'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 5. Financial Fines & Receipts Report Table */}
            {reportType === 'fines' && (
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-slate-200 text-slate-800 font-black uppercase text-[10px] border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-slate-300 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Receipt #</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Patron Name & Code</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Book Title</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 text-right">Amount</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 text-center">Status</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Payment Mode</th>
                    <th className="py-2.5 px-3">Date Settled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {fines.map((f, idx) => (
                    <tr key={f.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-center text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-indigo-800">
                        {f.receiptNumber || 'PENDING'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">
                        {f.memberName}
                        <span className="block text-[10px] font-mono text-slate-500">{f.memberCode}</span>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-700">{f.bookTitle}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-black text-slate-900">
                        {settings.currencySymbol}
                        {f.amount.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                            f.status === 'paid'
                              ? 'border-emerald-600 text-emerald-800 bg-emerald-50'
                              : 'border-rose-600 text-rose-800 bg-rose-50'
                          }`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 uppercase font-mono text-[10px]">
                        {f.paymentMethod || '—'}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {f.paidAt ? new Date(f.paidAt).toLocaleDateString() : 'Unpaid'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                  <tr>
                    <td colSpan={4} className="py-2 px-3 text-right text-slate-700">
                      Total Fines Assessed / Collected:
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-black text-emerald-800">
                      {settings.currencySymbol}
                      {totalFineCollected.toFixed(2)}
                    </td>
                    <td colSpan={3} className="py-2 px-3 text-[10px] text-slate-500">
                      Pending Dues: {settings.currencySymbol}
                      {totalFinePending.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}

            {/* 6. Reading Room Register Table */}
            {reportType === 'reading_room' && (
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-slate-200 text-slate-800 font-black uppercase text-[10px] border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-slate-300 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Student ID & Name</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Mobile</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Seat #</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Shift</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Plan</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Fee Status</th>
                    <th className="py-2.5 px-3 text-center">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {students.map((s, idx) => (
                    <tr key={s.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-center text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">
                        {s.name}
                        <span className="block text-[10px] font-mono text-indigo-700 font-bold">
                          {s.studentId}
                        </span>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono">{s.mobile}</td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-indigo-800">
                        {s.allottedSeatNumber || 'Unallotted'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 uppercase text-[10px] font-bold">
                        {s.shift}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200">{s.planName}</td>
                      <td className="py-2 px-3 border-r border-slate-200">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                            s.dueAmount <= 0
                              ? 'border-emerald-600 text-emerald-800 bg-emerald-50'
                              : 'border-rose-600 text-rose-800 bg-rose-50'
                          }`}
                        >
                          {s.dueAmount <= 0 ? 'PAID' : `DUE (${settings.currencySymbol}${s.dueAmount.toFixed(0)})`}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-semibold">
                        {s.expiryDate ? new Date(s.expiryDate).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Official Notes / Policy Remarks (Optional) */}
          {includeRemarks && (
            <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 mb-8">
              <span className="block font-bold text-[10px] uppercase tracking-wider text-slate-700 mb-0.5">
                {isHindi ? 'आधिकारिक नोट एवं अनुपालन शर्तें:' : 'Official Audit Compliance & Policy Notes:'}
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed font-normal">{remarksNote}</p>
            </div>
          )}

          {/* Institutional Signatures & Verification Seal Block */}
          {includeSignatures && (
            <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-slate-900 mt-10 print:break-inside-avoid">
              <div className="text-center">
                <div className="h-14 border-b border-dashed border-slate-400 mb-2"></div>
                <p className="font-bold text-slate-900 text-xs">{currentUser.displayName}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  {currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'LIBRARIAN'
                    ? 'Circulation In-Charge / Admin'
                    : 'Library Staff Operator'}
                </p>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">Prepared By & Timestamp</p>
              </div>

              <div className="text-center">
                <div className="h-14 border-b border-dashed border-slate-400 mb-2"></div>
                <p className="font-bold text-slate-900 text-xs">Chief Librarian / Registrar</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Audit Committee Head</p>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">Verified & Cross-Checked</p>
              </div>

              <div className="text-center flex flex-col items-center">
                <div className="w-24 h-14 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  OFFICIAL SEALS & STAMP
                </div>
                <p className="font-bold text-slate-900 text-xs">Director / Principal</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Institutional Authority</p>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">Approved & Certified</p>
              </div>
            </div>
          )}

          {/* Document Footer */}
          <div className="mt-8 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[9px] text-slate-400 print:break-inside-avoid">
            <span>
              {settings.libraryName || 'LibraryPro Management System'} • Institutional Compliance Copy • Ref:{' '}
              {documentRefNumber}
            </span>
            <span>
              Generated on {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Modal Bottom Action Bar (Hidden in Print) */}
        <div className="no-print bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {isHindi
              ? 'टिप: प्रिंटर डायलॉग में "Save as PDF" चुनकर रिपोर्ट को कंप्यूटर में सुरक्षित करें।'
              : 'Tip: Select "Save as PDF" in your print dialog to download this report as a PDF file.'}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              {isHindi ? 'बंद करें' : 'Close'}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer active:scale-98"
            >
              <Printer className="w-4 h-4" />
              {isHindi ? 'PDF रिपोर्ट प्रिंट करें' : 'Print / Save PDF Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
