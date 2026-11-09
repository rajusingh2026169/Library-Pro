import React, { useState, useMemo } from 'react';
import {
  Clock,
  UserCheck,
  UserX,
  Search,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  Filter,
  ArrowRight,
  Armchair,
  QrCode,
} from 'lucide-react';
import { useReadingRoom } from '../../context/ReadingRoomContext';
import { useApp } from '../../context/AppContext';
import { RRAttendance } from '../../types/readingRoom';
import { QRScannerModal, ScannedResult } from '../common/QRScannerModal';

export const AttendanceTrackerView: React.FC = () => {
  const { students, attendance, checkInStudent, checkOutStudent, markAttendance } = useReadingRoom();
  const { addToast } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [quickSearch, setQuickSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'inside' | 'checked_out'>('all');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualStatus, setManualStatus] = useState<RRAttendance['status']>('present');
  const [manualCheckIn, setManualCheckIn] = useState('09:00 AM');
  const [manualCheckOut, setManualCheckOut] = useState('05:00 PM');

  // Logs for selected date
  const dateLogs = useMemo(() => {
    return attendance.filter((a) => a.date === selectedDate);
  }, [attendance, selectedDate]);

  // Filtered attendance list
  const filteredLogs = useMemo(() => {
    return dateLogs.filter((a) => {
      if (statusFilter === 'inside' && a.checkOutTime) return false;
      if (statusFilter === 'checked_out' && !a.checkOutTime) return false;
      if (quickSearch.trim()) {
        const q = quickSearch.toLowerCase();
        const matchName = a.studentName.toLowerCase().includes(q);
        const matchCode = a.studentCode.toLowerCase().includes(q);
        const matchSeat = a.seatNumber?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchSeat) return false;
      }
      return true;
    });
  }, [dateLogs, statusFilter, quickSearch]);

  // Today stats
  const todayTotal = dateLogs.filter((a) => a.status === 'present').length;
  const currentlyInside = dateLogs.filter((a) => !a.checkOutTime && a.status === 'present').length;
  const checkedOutCount = dateLogs.filter((a) => a.checkOutTime && a.status === 'present').length;

  // Active students eligible for quick check in (not currently inside)
  const quickSearchMatches = useMemo(() => {
    if (!quickSearch.trim()) return [];
    const q = quickSearch.toLowerCase().trim();
    return students
      .filter((s) => s.status === 'active')
      .filter((s) => s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q))
      .slice(0, 5);
  }, [students, quickSearch]);

  const handleQuickCheckIn = async (studentId: string) => {
    const res = await checkInStudent(studentId);
    if (res.success) {
      addToast({ type: 'success', title: 'Checked In', message: 'Student attendance logged.' });
      setQuickSearch('');
    } else {
      addToast({ type: 'error', title: 'Check In Error', message: res.error });
    }
  };

  const handleQuickCheckOut = async (studentId: string) => {
    const res = await checkOutStudent(studentId);
    if (res.success) {
      addToast({ type: 'info', title: 'Checked Out', message: 'Check-out timestamp recorded.' });
    } else {
      addToast({ type: 'error', title: 'Check Out Error', message: res.error });
    }
  };

  const handleScanResult = async (result: ScannedResult) => {
    const raw = result.id || result.raw;
    if (!raw) return;

    const clean = raw.trim().toLowerCase();
    const student = students.find(
      (s) => s.studentId.toLowerCase() === clean || s.id.toLowerCase() === clean
    );

    if (!student) {
      addToast({
        type: 'error',
        title: 'Student Not Found',
        message: `No active student found matching ID "${raw}".`,
      });
      return;
    }

    if (student.status !== 'active') {
      addToast({
        type: 'warning',
        title: 'Inactive Student',
        message: `${student.name}'s account is currently marked ${student.status}.`,
      });
      return;
    }

    // Check if student is currently inside today
    const activeLog = attendance.find(
      (a) => a.studentId === student.id && a.date === todayStr && !a.checkOutTime
    );

    if (activeLog) {
      // Auto Check Out
      const res = await checkOutStudent(student.id);
      if (res.success) {
        addToast({
          type: 'info',
          title: 'Checked Out (Pass Scanned)',
          message: `${student.name} (${student.studentId}) successfully departed.`,
        });
      } else {
        addToast({ type: 'error', title: 'Check Out Error', message: res.error });
      }
    } else {
      // Auto Check In
      const res = await checkInStudent(student.id);
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Checked In (Pass Scanned)',
          message: `${student.name} (${student.studentId}) entry recorded. Seat: ${student.allottedSeatNumber || 'General'}`,
        });
      } else {
        addToast({ type: 'error', title: 'Check In Error', message: res.error });
      }
    }
  };

  const handleSaveManualAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === manualStudentId);
    if (!student) return;

    const res = await markAttendance({
      studentId: student.id,
      studentCode: student.studentId,
      studentName: student.name,
      seatNumber: student.allottedSeatNumber,
      date: selectedDate,
      checkInTime: manualCheckIn,
      checkOutTime: manualCheckOut || undefined,
      status: manualStatus,
      shift: student.shift,
    });

    if (res.success) {
      addToast({ type: 'success', title: 'Attendance Logged', message: `Marked for ${student.name}.` });
      setIsManualModalOpen(false);
      setManualStudentId('');
    } else {
      addToast({ type: 'error', title: 'Error', message: res.error });
    }
  };

  return (
    <div className="space-y-6">
      {/* Attendance KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Present ({selectedDate === todayStr ? 'Today' : selectedDate})
            </span>
            <h4 className="text-3xl font-black text-slate-900 mt-1">{todayTotal}</h4>
            <span className="text-xs text-slate-400">Total verified entries</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Currently Inside Study Hall
            </span>
            <h4 className="text-3xl font-black text-emerald-600 mt-1">{currentlyInside}</h4>
            <span className="text-xs text-emerald-600/80 font-medium">Checked-in & seated</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Checked Out
            </span>
            <h4 className="text-3xl font-black text-slate-700 mt-1">{checkedOutCount}</h4>
            <span className="text-xs text-slate-400">Departed for today</span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <UserX className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Check-In / Search Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-2xl text-white shadow-md relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              Quick Check-In Desk (तुरंत हाजिरी दर्ज करें)
            </h3>
            <p className="text-xs text-indigo-200 mt-0.5">
              Scan student QR identity pass or enter ID to record instant hall access.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer border border-emerald-400/40"
            >
              <QrCode className="w-4 h-4 text-emerald-200" />
              Scan QR Pass (कैमरा / स्कैनर)
            </button>
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Manual Entry
            </button>
          </div>
        </div>

        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Scan barcode or type student name / ID (e.g. RR-2026-001)..."
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 text-white placeholder-slate-400 border border-white/20 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 backdrop-blur-xs"
          />

          {/* Quick results dropdown if typing */}
          {quickSearchMatches.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 z-30 p-2 space-y-1 text-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-2 block">
                Matching Active Students
              </span>
              {quickSearchMatches.map((stu) => {
                const isCurrentlyInside = dateLogs.some(
                  (a) => a.studentId === stu.id && !a.checkOutTime
                );

                return (
                  <div
                    key={stu.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={stu.photoUrl}
                        alt={stu.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <h5 className="font-bold text-xs text-slate-900">{stu.name}</h5>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {stu.studentId} • Seat: {stu.allottedSeatNumber || 'None'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isCurrentlyInside ? (
                        <button
                          onClick={() => handleQuickCheckIn(stu.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-xs flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Check In
                        </button>
                      ) : (
                        <button
                          onClick={() => handleQuickCheckOut(stu.id)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-xs flex items-center gap-1"
                        >
                          <UserX className="w-3.5 h-3.5" /> Check Out
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Date filter & Tab filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Date:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {selectedDate !== todayStr && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="text-xs text-indigo-600 hover:underline font-bold ml-1 cursor-pointer"
            >
              Today
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'all', label: `All Logs (${dateLogs.length})` },
            { id: 'inside', label: `Inside (${currentlyInside})` },
            { id: 'checked_out', label: `Checked Out (${checkedOutCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Seat Allocated</th>
                <th className="py-3.5 px-4">Check-In Time</th>
                <th className="py-3.5 px-4">Check-Out Time</th>
                <th className="py-3.5 px-4">Duration / Shift</th>
                <th className="py-3.5 px-4">Current Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No attendance logs found for {selectedDate}.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isStillInside = !log.checkOutTime;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <h4 className="font-bold text-slate-900">{log.studentName}</h4>
                          <span className="font-mono text-[10px] text-indigo-600 font-bold">
                            {log.studentCode}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {log.seatNumber ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                            <Armchair className="w-3 h-3 text-emerald-600" />
                            {log.seatNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {log.checkInTime}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        {log.checkOutTime ? (
                          <span className="font-bold text-slate-700">{log.checkOutTime}</span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Present Inside
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 capitalize text-slate-600">
                        {log.shift ? log.shift.replace('_', ' ') : 'General'}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isStillInside
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isStillInside ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                            }`}
                          />
                          {isStillInside ? 'In Hall' : 'Completed'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isStillInside && selectedDate === todayStr && (
                          <button
                            onClick={() => handleQuickCheckOut(log.studentId)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer transition"
                          >
                            Check Out
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-scale-in">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h4 className="font-extrabold text-sm">Manual Attendance Log</h4>
              <button onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveManualAttendance} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Student *</label>
                <select
                  required
                  value={manualStudentId}
                  onChange={(e) => setManualStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.studentId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Check-In Time</label>
                <input
                  type="text"
                  placeholder="e.g. 08:30 AM"
                  value={manualCheckIn}
                  onChange={(e) => setManualCheckIn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Check-Out Time (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 02:00 PM"
                  value={manualCheckOut}
                  onChange={(e) => setManualCheckOut(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!manualStudentId}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR & Barcode Attendance Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanResult}
        title="Student ID Pass Scanner"
        subtitle="Point camera at student's QR ID card, or scan with barcode gun"
        expectedType="STUDENT"
        sampleItems={students.map((s) => ({
          id: s.id,
          label: `${s.name} (${s.allottedSeatNumber ? 'Seat ' + s.allottedSeatNumber : 'General'})`,
          code: s.studentId,
          type: 'STUDENT',
        }))}
      />
    </div>
  );
};
