import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Receipt,
  Printer,
  Download,
  Calendar,
  AlertTriangle,
  CreditCard,
  UserCheck,
  Phone,
  Eye,
  Filter,
} from 'lucide-react';
import { useReadingRoom } from '../../context/ReadingRoomContext';
import { useApp } from '../../context/AppContext';
import { RRPayment, RRStudent } from '../../types/readingRoom';

interface ReadingRoomReportsViewProps {
  onOpenReceipt: (payment: RRPayment) => void;
  onOpenCollectFee: (student: RRStudent) => void;
}

export const ReadingRoomReportsView: React.FC<ReadingRoomReportsViewProps> = ({
  onOpenReceipt,
  onOpenCollectFee,
}) => {
  const { payments, students, attendance } = useReadingRoom();
  const { settings } = useApp();

  const [activeReportTab, setActiveReportTab] = useState<'fees' | 'dues' | 'attendance' | 'expiries'>('fees');
  const [feeSearch, setFeeSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  const today = new Date().toISOString().split('T')[0];

  // 1. Fee collection stats
  const totalRevenueCollected = payments.reduce((sum, p) => sum + (p.netAmount || 0), 0);
  const upiTotal = payments
    .filter((p) => p.paymentMethod === 'UPI')
    .reduce((sum, p) => sum + (p.netAmount || 0), 0);
  const cashTotal = payments
    .filter((p) => p.paymentMethod === 'CASH')
    .reduce((sum, p) => sum + (p.netAmount || 0), 0);
  const cardOrOnlineTotal = payments
    .filter((p) => p.paymentMethod === 'CARD' || p.paymentMethod === 'ONLINE')
    .reduce((sum, p) => sum + (p.netAmount || 0), 0);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (methodFilter !== 'all' && p.paymentMethod !== methodFilter) return false;
      if (feeSearch.trim()) {
        const q = feeSearch.toLowerCase();
        const matchName = p.studentName.toLowerCase().includes(q);
        const matchCode = p.studentCode.toLowerCase().includes(q);
        const matchRcpt = p.receiptNumber.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchRcpt) return false;
      }
      return true;
    });
  }, [payments, methodFilter, feeSearch]);

  // 2. Pending dues students
  const dueStudents = students.filter((s) => s.dueAmount > 0);
  const totalPendingDues = dueStudents.reduce((sum, s) => sum + s.dueAmount, 0);

  // 3. Expiries (next 7 days or already expired)
  const next7Days = new Date();
  next7Days.setDate(next7Days.getDate() + 7);
  const next7DaysStr = next7Days.toISOString().split('T')[0];

  const expiringStudents = students.filter(
    (s) => s.status === 'expired' || (s.expiryDate <= next7DaysStr && s.status === 'active')
  );

  // Export CSV helper
  const handleExportCSV = () => {
    if (activeReportTab === 'fees') {
      const headers = ['Receipt No', 'Date', 'Student ID', 'Student Name', 'Mobile', 'Plan', 'Seat', 'Amount', 'Method'];
      const rows = filteredPayments.map((p) => [
        p.receiptNumber,
        p.paymentDate,
        p.studentCode,
        `"${p.studentName}"`,
        p.mobile || '',
        `"${p.planName}"`,
        p.seatNumber || '',
        p.netAmount,
        p.paymentMethod,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ReadingRoom_Fee_Report_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (activeReportTab === 'dues') {
      const headers = ['Student ID', 'Name', 'Mobile', 'Plan', 'Seat', 'Due Amount'];
      const rows = dueStudents.map((s) => [
        s.studentId,
        `"${s.name}"`,
        s.mobile,
        `"${s.planName}"`,
        s.allottedSeatNumber || '',
        s.dueAmount,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ReadingRoom_Due_Payments_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Reading Room Reports & Financials
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit payment receipts, due collections, attendance counts, and membership renewal lists.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-fit">
        {[
          { id: 'fees', label: 'Fee Collection Logs', count: payments.length },
          { id: 'dues', label: 'Pending Dues Report', count: dueStudents.length },
          { id: 'expiries', label: 'Expiries & Renewals', count: expiringStudents.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeReportTab === tab.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeReportTab === tab.id ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* TAB 1: Fee Collection Report */}
      {activeReportTab === 'fees' && (
        <div className="space-y-4">
          {/* Revenue Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                Total Collections
              </span>
              <h4 className="text-2xl font-black text-emerald-700 mt-1">
                {settings.currencySymbol || '₹'}
                {totalRevenueCollected.toFixed(2)}
              </h4>
              <span className="text-[10px] text-slate-400">All payment receipts</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-indigo-700 tracking-wider">
                UPI Collections
              </span>
              <h4 className="text-2xl font-black text-indigo-700 mt-1">
                {settings.currencySymbol || '₹'}
                {upiTotal.toFixed(2)}
              </h4>
              <span className="text-[10px] text-indigo-500">Google Pay / PhonePe / QR</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-amber-700 tracking-wider">
                Cash Collections
              </span>
              <h4 className="text-2xl font-black text-amber-700 mt-1">
                {settings.currencySymbol || '₹'}
                {cashTotal.toFixed(2)}
              </h4>
              <span className="text-[10px] text-amber-600">Counter Cash Desk</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-700 tracking-wider">
                Card / Net Banking
              </span>
              <h4 className="text-2xl font-black text-slate-800 mt-1">
                {settings.currencySymbol || '₹'}
                {cardOrOnlineTotal.toFixed(2)}
              </h4>
              <span className="text-[10px] text-slate-400">Card & Bank Transfers</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <input
              type="text"
              placeholder="Filter by receipt number, student name, or ID..."
              value={feeSearch}
              onChange={(e) => setFeeSearch(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="all">All Payment Methods</option>
              <option value="UPI">UPI Payments</option>
              <option value="CASH">Cash Payments</option>
              <option value="CARD">Card Payments</option>
              <option value="ONLINE">Bank Transfer</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Receipt No</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Plan / Seat</th>
                    <th className="py-3.5 px-4">Mode</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4 text-right">Receipt Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        {p.receiptNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{p.studentName}</span>
                        <span className="text-[10px] font-mono text-slate-500">{p.studentCode}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold block">{p.planName}</span>
                        {p.seatNumber && (
                          <span className="text-[10px] text-emerald-700 font-bold">Seat {p.seatNumber}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold px-2 py-0.5 bg-slate-100 rounded text-[10px]">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-emerald-700 text-sm">
                        {settings.currencySymbol || '₹'}
                        {p.netAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onOpenReceipt(p)}
                          className="flex items-center gap-1 ml-auto px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 cursor-pointer transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Pending Dues */}
      {activeReportTab === 'dues' && (
        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-600 text-white rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-rose-950 text-sm">Outstanding Due Balance</h4>
                <p className="text-xs text-rose-700">
                  {dueStudents.length} students have unpaid membership fee installments.
                </p>
              </div>
            </div>
            <span className="font-mono font-black text-2xl text-rose-700">
              {settings.currencySymbol || '₹'}
              {totalPendingDues.toFixed(2)}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Seat</th>
                  <th className="py-3.5 px-4">Plan</th>
                  <th className="py-3.5 px-4">Paid So Far</th>
                  <th className="py-3.5 px-4">Due Amount</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dueStudents.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {stu.name} <span className="font-mono text-slate-400 text-[10px]">({stu.studentId})</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">+91 {stu.mobile}</td>
                    <td className="py-3 px-4 font-bold text-emerald-800">
                      {stu.allottedSeatNumber ? `Seat ${stu.allottedSeatNumber}` : '—'}
                    </td>
                    <td className="py-3 px-4 font-semibold">{stu.planName}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {settings.currencySymbol || '₹'}
                      {stu.paidAmount}
                    </td>
                    <td className="py-3 px-4 font-mono font-black text-rose-600 text-sm">
                      {settings.currencySymbol || '₹'}
                      {stu.dueAmount}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onOpenCollectFee(stu)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
                      >
                        Collect Due
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Expiries */}
      {activeReportTab === 'expiries' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500 text-white rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-amber-950 text-sm">Upcoming & Expired Memberships</h4>
                <p className="text-xs text-amber-800">
                  Students expiring within 7 days or currently expired.
                </p>
              </div>
            </div>
            <span className="font-mono font-black text-xl text-amber-900">
              {expiringStudents.length} Students
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Seat</th>
                  <th className="py-3.5 px-4">Plan</th>
                  <th className="py-3.5 px-4">Expiry Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expiringStudents.map((stu) => {
                  const isExpired = stu.status === 'expired' || stu.expiryDate < today;

                  return (
                    <tr key={stu.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {stu.name} <span className="font-mono text-slate-400 text-[10px]">({stu.studentId})</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium">+91 {stu.mobile}</td>
                      <td className="py-3 px-4 font-bold text-emerald-800">
                        {stu.allottedSeatNumber ? `Seat ${stu.allottedSeatNumber}` : '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold">{stu.planName}</td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-600">
                        {new Date(stu.expiryDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isExpired ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isExpired ? 'Expired' : 'Expiring Soon'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onOpenCollectFee(stu)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
                        >
                          Renew Membership
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
