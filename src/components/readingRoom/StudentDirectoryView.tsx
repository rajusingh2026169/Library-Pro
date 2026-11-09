import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  ShieldCheck,
  CreditCard,
  Armchair,
  Phone,
  Calendar,
  AlertTriangle,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Filter,
} from 'lucide-react';
import { useReadingRoom } from '../../context/ReadingRoomContext';
import { useApp } from '../../context/AppContext';
import { RRStudent } from '../../types/readingRoom';

interface StudentDirectoryViewProps {
  onOpenAdmission: () => void;
  onOpenIdCard: (student: RRStudent) => void;
  onOpenCollectFee: (student: RRStudent) => void;
}

export const StudentDirectoryView: React.FC<StudentDirectoryViewProps> = ({
  onOpenAdmission,
  onOpenIdCard,
  onOpenCollectFee,
}) => {
  const { students, updateStudent, deactivateStudent, allotSeat, vacateSeat, seats } = useReadingRoom();
  const { settings, addToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired' | 'inactive'>('all');
  const [shiftFilter, setShiftFilter] = useState<string>('all');
  const [editingStudent, setEditingStudent] = useState<RRStudent | null>(null);
  const [reallocatingStudent, setReallocatingStudent] = useState<RRStudent | null>(null);
  const [targetSeatId, setTargetSeatId] = useState<string>('');

  const today = new Date().toISOString().split('T')[0];
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  const threeDaysStr = threeDaysLater.toISOString().split('T')[0];

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchName = s.name.toLowerCase().includes(q);
        const matchId = s.studentId.toLowerCase().includes(q);
        const matchPhone = s.mobile.includes(q);
        const matchSeat = s.allottedSeatNumber?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchPhone && !matchSeat) return false;
      }

      // Status Filter
      if (statusFilter === 'active' && s.status !== 'active') return false;
      if (statusFilter === 'inactive' && s.status !== 'inactive') return false;
      if (statusFilter === 'expired') {
        const isExp = s.status === 'expired' || s.expiryDate < today;
        if (!isExp) return false;
      }
      if (statusFilter === 'expiring') {
        const isExpSoon = s.status === 'active' && s.expiryDate >= today && s.expiryDate <= threeDaysStr;
        if (!isExpSoon) return false;
      }

      // Shift Filter
      if (shiftFilter !== 'all' && s.shift !== shiftFilter) return false;

      return true;
    });
  }, [students, searchQuery, statusFilter, shiftFilter, today, threeDaysStr]);

  // Counts for pills
  const totalCount = students.length;
  const activeCount = students.filter((s) => s.status === 'active').length;
  const expiringCount = students.filter(
    (s) => s.status === 'active' && s.expiryDate >= today && s.expiryDate <= threeDaysStr
  ).length;
  const expiredCount = students.filter((s) => s.status === 'expired' || s.expiryDate < today).length;

  const availableSeats = seats.filter((st) => st.status === 'available');

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const res = await updateStudent(editingStudent.id, {
      name: editingStudent.name,
      mobile: editingStudent.mobile,
      email: editingStudent.email,
      address: editingStudent.address,
      shift: editingStudent.shift,
      emergencyContact: editingStudent.emergencyContact,
      notes: editingStudent.notes,
    });
    if (res.success) {
      addToast({ type: 'success', title: 'Student Updated', message: 'Profile details saved.' });
      setEditingStudent(null);
    } else {
      addToast({ type: 'error', title: 'Update Failed', message: res.error });
    }
  };

  const handleSeatReallocation = async () => {
    if (!reallocatingStudent) return;
    if (targetSeatId === 'VACATE') {
      if (reallocatingStudent.allottedSeatId) {
        await vacateSeat(reallocatingStudent.allottedSeatId);
        addToast({ type: 'info', title: 'Seat Vacated', message: 'Seat removed from student.' });
      }
    } else if (targetSeatId) {
      const res = await allotSeat(targetSeatId, reallocatingStudent.id);
      if (!res.success) {
        addToast({ type: 'error', title: 'Failed to Allot', message: res.error });
        return;
      }
      addToast({ type: 'success', title: 'Seat Updated', message: 'Assigned new seat.' });
    }
    setReallocatingStudent(null);
    setTargetSeatId('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Student & Member Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage reading room registrations, seating assignments, cards, and payment histories.
          </p>
        </div>

        <button
          onClick={onOpenAdmission}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-600/20 active:scale-98 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          New Admission (नया छात्र जोड़ें)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, student ID, mobile, or seat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quick status tabs */}
          <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('expiring')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                statusFilter === 'expiring'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Expiring Soon ({expiringCount})
            </button>
            <button
              onClick={() => setStatusFilter('expired')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'expired'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              Expired ({expiredCount})
            </button>

            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="all">All Shifts</option>
              <option value="full_day">Full Day</option>
              <option value="morning">Morning Shift</option>
              <option value="evening">Evening Shift</option>
              <option value="night">Night Shift</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Contact & Shift</th>
                <th className="py-3.5 px-4">Seat Allocated</th>
                <th className="py-3.5 px-4">Plan & Expiry</th>
                <th className="py-3.5 px-4">Fee Paid / Due</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No students found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isExpiringSoon =
                    student.status === 'active' &&
                    student.expiryDate >= today &&
                    student.expiryDate <= threeDaysStr;
                  const isExpired = student.status === 'expired' || student.expiryDate < today;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Student Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.photoUrl}
                            alt={student.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200 bg-slate-100 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-xs truncate max-w-[150px]">
                              {student.name}
                            </h4>
                            <span className="font-mono text-[10px] text-indigo-600 font-bold block">
                              {student.studentId}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                              Joined: {new Date(student.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact & Shift */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="flex items-center gap-1 font-mono font-medium text-slate-800">
                            <Phone className="w-3 h-3 text-slate-400" /> +91 {student.mobile}
                          </span>
                          <span className="text-[10px] text-slate-500 capitalize flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {student.shift.replace('_', ' ')}
                          </span>
                        </div>
                      </td>

                      {/* Seat */}
                      <td className="py-3 px-4">
                        {student.allottedSeatNumber ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-lg border border-emerald-200 text-xs">
                            <Armchair className="w-3.5 h-3.5 text-emerald-600" />
                            Seat {student.allottedSeatNumber}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setReallocatingStudent(student);
                              setTargetSeatId('');
                            }}
                            className="text-[11px] text-amber-700 bg-amber-50 hover:bg-amber-100 font-semibold px-2 py-0.5 rounded border border-amber-200 cursor-pointer"
                          >
                            + Allot Seat
                          </button>
                        )}
                      </td>

                      {/* Plan & Expiry */}
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-semibold text-slate-800 block text-xs">
                            {student.planName}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span
                              className={`font-mono font-bold ${
                                isExpired
                                  ? 'text-rose-600'
                                  : isExpiringSoon
                                  ? 'text-amber-600 font-extrabold'
                                  : 'text-slate-600'
                              }`}
                            >
                              {new Date(student.expiryDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          {isExpiringSoon && (
                            <span className="inline-block mt-0.5 text-[9px] font-bold uppercase bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                              Expiring Soon
                            </span>
                          )}
                          {isExpired && (
                            <span className="inline-block mt-0.5 text-[9px] font-bold uppercase bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded">
                              Membership Expired
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Fee Status */}
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-mono font-bold text-emerald-700 block">
                            Paid: {settings.currencySymbol || '₹'}{student.paidAmount}
                          </span>
                          {student.dueAmount > 0 ? (
                            <span className="font-mono font-bold text-rose-600 text-[11px] block">
                              Due: {settings.currencySymbol || '₹'}{student.dueAmount}
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-semibold block">
                              Fully Cleared
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            student.status === 'active' && !isExpired
                              ? 'bg-emerald-100 text-emerald-800'
                              : isExpired
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              student.status === 'active' && !isExpired
                                ? 'bg-emerald-500'
                                : isExpired
                                ? 'bg-rose-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          {isExpired ? 'Expired' : student.status}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* ID Card button */}
                          <button
                            onClick={() => onOpenIdCard(student)}
                            title="View / Print Student ID Card"
                            className="p-1.5 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-lg border border-indigo-200 transition cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>

                          {/* Fee Collection button */}
                          <button
                            onClick={() => onOpenCollectFee(student)}
                            title="Collect Fee / Renew Plan"
                            className="p-1.5 text-emerald-700 hover:text-white hover:bg-emerald-600 rounded-lg border border-emerald-200 transition cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>

                          {/* Seat change button */}
                          <button
                            onClick={() => {
                              setReallocatingStudent(student);
                              setTargetSeatId(student.allottedSeatId || '');
                            }}
                            title="Change / Allot Seat"
                            className="p-1.5 text-slate-600 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-200 transition cursor-pointer"
                          >
                            <Armchair className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => setEditingStudent(student)}
                            title="Edit Student Info"
                            className="p-1.5 text-slate-600 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-200 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-scale-in">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h4 className="font-extrabold text-sm">Edit Student: {editingStudent.name}</h4>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile</label>
                <input
                  type="tel"
                  required
                  value={editingStudent.mobile}
                  onChange={(e) => setEditingStudent({ ...editingStudent, mobile: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editingStudent.address}
                  onChange={(e) => setEditingStudent({ ...editingStudent, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Shift</label>
                <select
                  value={editingStudent.shift}
                  onChange={(e) => setEditingStudent({ ...editingStudent, shift: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                >
                  <option value="full_day">Full Day</option>
                  <option value="morning">Morning Shift</option>
                  <option value="evening">Evening Shift</option>
                  <option value="night">Night Shift</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm(`Deactivate student ${editingStudent.name}? This will vacate their seat.`)) {
                      await deactivateStudent(editingStudent.id);
                      addToast({ type: 'info', title: 'Student Deactivated', message: 'Patron marked inactive.' });
                      setEditingStudent(null);
                    }
                  }}
                  className="text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Deactivate
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="px-3 py-1.5 border border-slate-300 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change / Allot Seat Modal */}
      {reallocatingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-scale-in">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h4 className="font-extrabold text-sm">Seat Allocation</h4>
              <button onClick={() => setReallocatingStudent(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Change or assign desk for <strong className="text-slate-900">{reallocatingStudent.name}</strong>.
                {reallocatingStudent.allottedSeatNumber && (
                  <span className="block mt-1 text-slate-500">
                    Currently assigned: <strong>Seat {reallocatingStudent.allottedSeatNumber}</strong>
                  </span>
                )}
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Choose Available Seat:</label>
                <select
                  value={targetSeatId}
                  onChange={(e) => setTargetSeatId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                >
                  <option value="">-- Choose New Seat --</option>
                  {reallocatingStudent.allottedSeatId && (
                    <option value="VACATE">-- Vacate Current Seat (Leave Unassigned) --</option>
                  )}
                  {availableSeats.map((st) => (
                    <option key={st.id} value={st.id}>
                      Desk {st.seatNumber} ({st.floor} - {st.section})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-emerald-600 mt-1 block font-medium">
                  {availableSeats.length} vacant seats available
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setReallocatingStudent(null)}
                  className="px-3 py-2 border border-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSeatReallocation}
                  disabled={!targetSeatId}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl"
                >
                  Confirm Allocation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
