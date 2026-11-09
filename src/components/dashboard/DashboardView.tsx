import React from 'react';
import {
  BookOpen,
  CheckCircle,
  Repeat,
  Users,
  AlertTriangle,
  Receipt,
  PlusCircle,
  CornerDownLeft,
  UserPlus,
  BookPlus,
  ArrowRight,
  TrendingUp,
  Clock,
  ExternalLink,
  Armchair,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useReadingRoom } from '../../context/ReadingRoomContext';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { NavigationTab } from '../layout/Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenQuickIssue: () => void;
  onOpenQuickReturn: () => void;
  onOpenAddBook: () => void;
  onOpenAddMember: () => void;
  onSelectLoanForReturn: (loanId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenQuickIssue,
  onOpenQuickReturn,
  onOpenAddBook,
  onOpenAddMember,
  onSelectLoanForReturn,
}) => {
  const { metrics, loans, settings, logs, books, members, language } = useApp();
  const { metrics: rrMetrics } = useReadingRoom();
  const isHindi = language === 'hi';

  const overdueLoansList = loans.filter((l) => l.status === 'overdue').slice(0, 5);
  const activeLoansList = loans.filter((l) => l.status === 'active' || l.status === 'overdue').slice(0, 5);

  // Group books by category for distribution summary
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) => {
      counts[b.category] = (counts[b.category] || 0) + (b.totalCopies || 0);
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [books]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold mb-2 backdrop-blur-xs border border-indigo-400/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {settings.institutionName} • {settings.libraryName}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {isHindi ? 'लाइब्रेरी प्रबंधन व डैशबोर्ड' : 'Library Circulation Command Center'}
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-xl">
            {isHindi
              ? 'किताबें जारी करना (Issue), वापस जमा करना (Return), छात्रों का रिकॉर्ड और लेट फीस का आसान प्रबंधन।'
              : 'Real-time catalog inventory, circulation desk operations, patron eligibility checks, and fee reconciliation.'}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenQuickIssue}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs rounded-xl transition shadow-md cursor-pointer active:scale-98"
          >
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            {isHindi ? 'किताब दें (Issue Book)' : 'Issue Book'}
          </button>
          <button
            onClick={onOpenQuickReturn}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-700/60 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition border border-indigo-500/30 cursor-pointer active:scale-98"
          >
            <CornerDownLeft className="w-4 h-4" />
            {isHindi ? 'किताब वापस लें (Return Book)' : 'Return Book'}
          </button>
        </div>

        {/* Subtle decorative circles */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title={isHindi ? 'कुल किताबें (Titles)' : 'Total Titles'}
          value={metrics.totalBooks}
          subtitle={isHindi ? `${metrics.totalCopies} कुल प्रतियां` : `${metrics.totalCopies} physical copies`}
          icon={<BookOpen className="w-5 h-5" />}
          iconBgColor="bg-blue-50 text-blue-600"
          onClick={() => onNavigate('books')}
        />
        <StatCard
          title={isHindi ? 'उपलब्ध किताबें (On Shelf)' : 'Available Copies'}
          value={metrics.availableCopies}
          subtitle={isHindi ? 'लाइब्रेरी में मौजूद हैं' : `${Math.round((metrics.availableCopies / (metrics.totalCopies || 1)) * 100)}% on shelf`}
          icon={<CheckCircle className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
          onClick={() => onNavigate('books')}
        />
        <StatCard
          title={isHindi ? 'छात्रों के पास (Issued)' : 'Issued Books'}
          value={metrics.issuedBooks}
          subtitle={isHindi ? 'छात्रों ने ली हुई हैं' : 'Currently checked out'}
          icon={<Repeat className="w-5 h-5" />}
          iconBgColor="bg-indigo-50 text-indigo-600"
          onClick={() => onNavigate('circulation')}
        />
        <StatCard
          title={isHindi ? 'पंजीकृत सदस्य (Members)' : 'Active Patrons'}
          value={metrics.activeMembers}
          subtitle={isHindi ? 'छात्र व शिक्षक' : 'Eligible borrowers'}
          icon={<Users className="w-5 h-5" />}
          iconBgColor="bg-violet-50 text-violet-600"
          onClick={() => onNavigate('members')}
        />
        <StatCard
          title={isHindi ? 'लेट किताबें (Overdue)' : 'Overdue Loans'}
          value={metrics.overdueLoans}
          subtitle={metrics.overdueLoans > 0 ? (isHindi ? 'तय तारीख से लेट' : 'Requires attention') : (isHindi ? 'सब समय पर हैं' : 'All loans on time')}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBgColor={metrics.overdueLoans > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'}
          onClick={() => onNavigate('circulation')}
        />
        <StatCard
          title={isHindi ? 'बाकी जुर्माना (Fines)' : 'Pending Fines'}
          value={`${settings.currencySymbol}${metrics.pendingFines.toFixed(2)}`}
          subtitle={isHindi ? 'जमा होना बाकी है' : 'Accrued late fees'}
          icon={<Receipt className="w-5 h-5" />}
          iconBgColor="bg-amber-50 text-amber-700"
          onClick={() => onNavigate('fines')}
        />
      </div>

      {/* Reading Room & Study Library Dashboard KPIs */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-indigo-900/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <Armchair className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">
                  {isHindi ? 'रीडिंग रूम व स्टडी लाइब्रेरी (Study Hall)' : 'Reading Room & Study Library'}
                </h3>
                <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Live
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                {isHindi
                  ? 'छात्र, सीट आवंटन, दैनिक हाजिरी और मासिक फीस संग्रह'
                  : 'Student admissions, seat allocations, daily attendance, and monthly fee collections'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('reading_room')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
          >
            {isHindi ? 'रीडिंग रूम खोलें' : 'Open Reading Room Desk'} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 6 Requested Reading Room Dashboard Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div
            onClick={() => onNavigate('reading_room')}
            className="bg-white/10 hover:bg-white/15 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 transition cursor-pointer group"
          >
            <span className="text-[10px] uppercase font-bold text-indigo-300 block truncate">
              {isHindi ? 'कुल छात्र' : 'Total Students'}
            </span>
            <h4 className="text-2xl font-black text-white mt-1 group-hover:text-indigo-200 transition">
              {rrMetrics.totalStudents}
            </h4>
            <span className="text-[10px] text-slate-300 block mt-0.5">
              {rrMetrics.activeStudents} {isHindi ? 'सक्रिय' : 'active'}
            </span>
          </div>

          <div
            onClick={() => onNavigate('reading_room')}
            className="bg-white/10 hover:bg-white/15 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 transition cursor-pointer group"
          >
            <span className="text-[10px] uppercase font-bold text-rose-300 block truncate">
              {isHindi ? 'भरी हुई सीटें' : 'Occupied Seats'}
            </span>
            <h4 className="text-2xl font-black text-rose-300 mt-1 group-hover:text-rose-200 transition">
              {rrMetrics.occupiedSeats}
            </h4>
            <span className="text-[10px] text-slate-300 block mt-0.5">
              {Math.round((rrMetrics.occupiedSeats / (rrMetrics.totalSeats || 1)) * 100)}% {isHindi ? 'भरी हैं' : 'occupancy'}
            </span>
          </div>

          <div
            onClick={() => onNavigate('reading_room')}
            className="bg-white/10 hover:bg-white/15 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 transition cursor-pointer group"
          >
            <span className="text-[10px] uppercase font-bold text-emerald-300 block truncate">
              {isHindi ? 'खाली सीटें' : 'Available Seats'}
            </span>
            <h4 className="text-2xl font-black text-emerald-300 mt-1 group-hover:text-emerald-200 transition">
              {rrMetrics.availableSeats}
            </h4>
            <span className="text-[10px] text-slate-300 block mt-0.5">
              {isHindi ? 'तुरंत बुकिंग के लिए' : 'Ready to allot'}
            </span>
          </div>

          <div
            onClick={() => onNavigate('reading_room')}
            className="bg-white/10 hover:bg-white/15 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 transition cursor-pointer group"
          >
            <span className="text-[10px] uppercase font-bold text-amber-300 block truncate">
              {isHindi ? 'आज की हाजिरी' : "Today's Attendance"}
            </span>
            <h4 className="text-2xl font-black text-amber-300 mt-1 group-hover:text-amber-200 transition">
              {rrMetrics.todayAttendance}
            </h4>
            <span className="text-[10px] text-slate-300 block mt-0.5">
              {rrMetrics.currentlyPresent} {isHindi ? 'अभी अंदर हैं' : 'currently present'}
            </span>
          </div>

          <div
            onClick={() => onNavigate('reading_room')}
            className="bg-white/10 hover:bg-white/15 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 transition cursor-pointer group"
          >
            <span className="text-[10px] uppercase font-bold text-indigo-200 block truncate">
              {isHindi ? 'मासिक फीस संग्रह' : 'Monthly Fee'}
            </span>
            <h4 className="text-2xl font-black text-white mt-1 group-hover:text-emerald-200 transition">
              {settings.currencySymbol || '₹'}{rrMetrics.monthlyFeeCollection.toFixed(0)}
            </h4>
            <span className="text-[10px] text-emerald-300 block mt-0.5">
              {isHindi ? 'इस माह का संग्रह' : 'Current month'}
            </span>
          </div>

          <div
            onClick={() => onNavigate('reading_room')}
            className="bg-white/10 hover:bg-white/15 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 transition cursor-pointer group"
          >
            <span className="text-[10px] uppercase font-bold text-rose-300 block truncate">
              {isHindi ? 'बाकी फीस' : 'Pending Fees'}
            </span>
            <h4 className="text-2xl font-black text-rose-400 mt-1 group-hover:text-rose-300 transition">
              {settings.currencySymbol || '₹'}{rrMetrics.pendingFees.toFixed(0)}
            </h4>
            <span className="text-[10px] text-rose-200 block mt-0.5">
              {isHindi ? 'वसूली बाकी है' : 'Unpaid balance'}
            </span>
          </div>
        </div>
      </div>

      {/* Circulation Daily Pulse Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">
                {isHindi ? 'आज दी गई किताबें (Issued Today)' : "Today's Checkouts"}
              </p>
              <h4 className="text-xl font-bold text-slate-900">
                {metrics.todayIssues} {isHindi ? 'किताबें' : 'books'}
              </h4>
            </div>
          </div>
          <button
            onClick={() => onNavigate('circulation')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            {isHindi ? 'विवरण' : 'History'} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CornerDownLeft className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">
                {isHindi ? 'आज वापस आई किताबें (Returned Today)' : "Today's Returns"}
              </p>
              <h4 className="text-xl font-bold text-slate-900">
                {metrics.todayReturns} {isHindi ? 'किताबें' : 'books'}
              </h4>
            </div>
          </div>
          <button
            onClick={() => onNavigate('circulation')}
            className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            {isHindi ? 'विवरण' : 'History'} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">
                {isHindi ? 'किताब बुकिंग कतार (Hold Queue)' : 'Active Hold Queue'}
              </p>
              <h4 className="text-xl font-bold text-slate-900">
                {metrics.activeReservations} {isHindi ? 'छात्र कतार में' : 'reservations'}
              </h4>
            </div>
          </div>
          <button
            onClick={() => onNavigate('reservations')}
            className="text-xs text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 cursor-pointer"
          >
            {isHindi ? 'कतार देखें' : 'Queue'} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Overdue Table + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Overdue Loans & Active Circulation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overdue Items Alert Box */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  {isHindi
                    ? `तय तारीख से लेट किताबें (${overdueLoansList.length}) - Overdue Loans`
                    : `Critical Overdue Loans (${overdueLoansList.length})`}
                </h3>
              </div>
              <button
                onClick={() => onNavigate('circulation')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                {isHindi ? 'सभी देखें' : 'View all'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {overdueLoansList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                {isHindi
                  ? '🎉 कोई भी किताब लेट नहीं है! सभी किताबें समय पर जमा हैं।'
                  : '🎉 No overdue loans currently on record. All books are within their permitted loan window!'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">{isHindi ? 'किताब का नाम (Book)' : 'Book Title'}</th>
                      <th className="py-3 px-4">{isHindi ? 'छात्र / सदस्य (Member)' : 'Member'}</th>
                      <th className="py-3 px-4">{isHindi ? 'अंतिम तारीख (Due Date)' : 'Due Date'}</th>
                      <th className="py-3 px-4">{isHindi ? 'जुर्माना (Fine)' : 'Accrued Fine'}</th>
                      <th className="py-3 px-4 text-right">{isHindi ? 'कार्य (Action)' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overdueLoansList.map((loan) => (
                      <tr key={loan.id} className="hover:bg-rose-50/40 transition">
                        <td className="py-3 px-4 font-semibold text-slate-800 max-w-xs truncate">
                          {loan.bookTitle}
                          <span className="block text-[11px] text-slate-400 font-mono font-normal">
                            ISBN: {loan.bookIsbn}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-700">{loan.memberName}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">{loan.memberCode}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-rose-600">
                            {new Date(loan.dueDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="rose">
                            {settings.currencySymbol}
                            {loan.fineAmount.toFixed(2)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onSelectLoanForReturn(loan.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition border border-rose-200 cursor-pointer"
                          >
                            {isHindi ? 'किताब वापस लें (Return)' : 'Return Book'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Catalog Category Distribution Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {isHindi ? 'विषयवार किताबें (Books by Category)' : 'Collection by Category'}
              </h3>
              <button
                onClick={() => onNavigate('books')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                {isHindi ? 'सभी किताबें देखें →' : 'Catalog overview →'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categoryCounts.slice(0, 4).map(([category, count]) => (
                <div key={category} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-700 truncate">{category}</p>
                  <p className="text-lg font-extrabold text-indigo-600 mt-0.5">
                    {count} {isHindi ? 'प्रतियां' : 'copies'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Activity Audit Feed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">
              {isHindi ? 'लाइब्रेरी गतिविधि रिकॉर्ड (Recent Activity)' : 'Recent Activity Log'}
            </h3>
            <button
              onClick={() => onNavigate('activity')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              {isHindi ? 'पूरा रिकॉर्ड' : 'Full Log'}
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-4 max-h-[500px]">
            {logs.slice(0, 8).map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 font-medium leading-snug">{log.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                    <span className="font-semibold text-slate-600">{log.userName}</span>
                    <span>•</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
