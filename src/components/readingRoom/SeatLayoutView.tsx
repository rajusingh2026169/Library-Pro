import React, { useState } from 'react';
import {
  Armchair,
  CheckCircle,
  AlertCircle,
  Zap,
  Lightbulb,
  Plus,
  UserCheck,
  UserX,
  Phone,
  Shield,
  Filter,
  Eye,
  Calendar,
  X,
} from 'lucide-react';
import { useReadingRoom } from '../../context/ReadingRoomContext';
import { useApp } from '../../context/AppContext';
import { RRSeat } from '../../types/readingRoom';

interface SeatLayoutViewProps {
  onOpenAdmissionWithSeat: (seatId: string) => void;
  onOpenStudentIdCard: (student: any) => void;
  onOpenCollectFee: (student: any) => void;
}

export const SeatLayoutView: React.FC<SeatLayoutViewProps> = ({
  onOpenAdmissionWithSeat,
  onOpenStudentIdCard,
  onOpenCollectFee,
}) => {
  const { seats, students, allotSeat, vacateSeat, setSeatStatus, addSeat } = useReadingRoom();
  const { settings, addToast } = useApp();

  const [selectedSeat, setSelectedSeat] = useState<RRSeat | null>(null);
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddSeatOpen, setIsAddSeatOpen] = useState(false);
  const [newSeatNumber, setNewSeatNumber] = useState('');
  const [newFloor, setNewFloor] = useState('Ground Floor');
  const [newSection, setNewSection] = useState('AC Main Hall');
  const [isAllotting, setIsAllotting] = useState(false);
  const [allotStudentId, setAllotStudentId] = useState('');

  // Unallotted active students
  const unallottedStudents = students.filter((s) => !s.allottedSeatId && s.status === 'active');

  // Filter seats
  const filteredSeats = seats.filter((s) => {
    if (floorFilter !== 'all' && s.floor !== floorFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  });

  const totalSeats = seats.length;
  const occupiedCount = seats.filter((s) => s.status === 'occupied').length;
  const availableCount = seats.filter((s) => s.status === 'available').length;
  const reservedCount = seats.filter((s) => s.status === 'reserved').length;
  const occupancyRate = totalSeats > 0 ? Math.round((occupiedCount / totalSeats) * 100) : 0;

  // Find student occupant for selected seat
  const occupant = selectedSeat?.currentStudentId
    ? students.find((s) => s.id === selectedSeat.currentStudentId)
    : null;

  const handleVacate = async (seatId: string) => {
    if (!window.confirm('Are you sure you want to vacate this seat? The student will remain registered but unassigned.')) {
      return;
    }
    const res = await vacateSeat(seatId);
    if (res.success) {
      addToast({ type: 'info', title: 'Seat Vacated', message: 'Seat is now marked as available.' });
      setSelectedSeat(null);
    } else {
      addToast({ type: 'error', title: 'Error', message: res.error });
    }
  };

  const handleConfirmAllot = async () => {
    if (!selectedSeat || !allotStudentId) return;
    const res = await allotSeat(selectedSeat.id, allotStudentId);
    if (res.success) {
      addToast({ type: 'success', title: 'Seat Allotted', message: `Allotted Seat ${selectedSeat.seatNumber}.` });
      setIsAllotting(false);
      setSelectedSeat(null);
      setAllotStudentId('');
    } else {
      addToast({ type: 'error', title: 'Failed to Allot', message: res.error });
    }
  };

  const handleCreateSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeatNumber.trim()) return;
    const res = await addSeat({
      seatNumber: newSeatNumber.trim().toUpperCase(),
      floor: newFloor,
      section: newSection,
      status: 'available',
      hasSocket: true,
      hasLight: true,
    });
    if (res.success) {
      addToast({ type: 'success', title: 'Seat Added', message: `Added ${newSeatNumber}.` });
      setIsAddSeatOpen(false);
      setNewSeatNumber('');
    } else {
      addToast({ type: 'error', title: 'Failed to Add Seat', message: res.error });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Occupancy Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Total Desks</span>
            <h4 className="text-2xl font-black text-slate-900 mt-0.5">{totalSeats}</h4>
            <span className="text-[10px] text-slate-400">Total capacity</span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <Armchair className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-emerald-700 tracking-wider">Available</span>
            <h4 className="text-2xl font-black text-emerald-600 mt-0.5">{availableCount}</h4>
            <span className="text-[10px] text-emerald-600/80 font-medium">Ready to allot</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-rose-700 tracking-wider">Occupied</span>
            <h4 className="text-2xl font-black text-rose-600 mt-0.5">{occupiedCount}</h4>
            <span className="text-[10px] text-rose-600/80 font-medium">Active students</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-amber-700 tracking-wider">Reserved</span>
            <h4 className="text-2xl font-black text-amber-600 mt-0.5">{reservedCount}</h4>
            <span className="text-[10px] text-amber-600/80 font-medium">On hold</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-4 lg:col-span-1 bg-gradient-to-br from-indigo-900 to-slate-900 p-4 rounded-2xl text-white shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-indigo-300 tracking-wider">Occupancy</span>
            <h4 className="text-2xl font-black mt-0.5">{occupancyRate}%</h4>
            <span className="text-[10px] text-indigo-200">Hall fill rate</span>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-indigo-400/30 border-t-indigo-400 flex items-center justify-center font-bold text-xs">
            {occupancyRate}%
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'all', label: 'All Desks' },
              { id: 'available', label: `Available (${availableCount})` },
              { id: 'occupied', label: `Occupied (${occupiedCount})` },
              { id: 'reserved', label: `Reserved (${reservedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
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

          {/* Floor filter */}
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Floors & Halls</option>
            <option value="Ground Floor">Ground Floor (AC Hall)</option>
            <option value="1st Floor">1st Floor (Silent Zone)</option>
          </select>
        </div>

        <button
          onClick={() => setIsAddSeatOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer whitespace-nowrap active:scale-98"
        >
          <Plus className="w-4 h-4" />
          Add Study Desk
        </button>
      </div>

      {/* Interactive Seat Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
              Floor Plan & Desk Allocation Layout
            </h3>
            <p className="text-xs text-slate-500">
              Click on any seat to view occupant profile, allot to student, or vacate desk.
            </p>
          </div>

          {/* Visual Legend */}
          <div className="hidden sm:flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />
              Available
            </span>
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="w-3 h-3 rounded-md bg-rose-500 inline-block" />
              Occupied
            </span>
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="w-3 h-3 rounded-md bg-amber-500 inline-block" />
              Reserved
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
          {filteredSeats.map((seat) => {
            const isOccupied = seat.status === 'occupied';
            const isAvailable = seat.status === 'available';
            const isReserved = seat.status === 'reserved';

            return (
              <button
                key={seat.id}
                onClick={() => {
                  setSelectedSeat(seat);
                  setIsAllotting(false);
                }}
                className={`relative flex flex-col items-center justify-between p-3 rounded-xl border-2 transition-all duration-150 cursor-pointer text-left hover:scale-102 hover:shadow-md ${
                  isOccupied
                    ? 'bg-rose-50/50 border-rose-300 hover:border-rose-500 text-rose-950'
                    : isReserved
                    ? 'bg-amber-50/50 border-amber-300 hover:border-amber-500 text-amber-950'
                    : 'bg-emerald-50/50 border-emerald-300 hover:border-emerald-500 text-emerald-950'
                }`}
              >
                {/* Top Badge: Desk Amenities */}
                <div className="w-full flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1">
                    {seat.hasSocket && (
                      <span title="Power Socket">
                        <Zap className="w-2.5 h-2.5 text-amber-500" />
                      </span>
                    )}
                    {seat.hasLight && (
                      <span title="Desk Lamp">
                        <Lightbulb className="w-2.5 h-2.5 text-indigo-500" />
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase ${
                      isOccupied
                        ? 'bg-rose-200 text-rose-800'
                        : isReserved
                        ? 'bg-amber-200 text-amber-800'
                        : 'bg-emerald-200 text-emerald-800'
                    }`}
                  >
                    {isOccupied ? 'Occupied' : isReserved ? 'Hold' : 'Open'}
                  </span>
                </div>

                {/* Desk Icon & Seat Number */}
                <div className="my-2 flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold ${
                      isOccupied
                        ? 'bg-rose-600 text-white'
                        : isReserved
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    <Armchair className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black tracking-tight mt-1">{seat.seatNumber}</span>
                </div>

                {/* Bottom details */}
                <div className="w-full text-center border-t border-slate-200/50 pt-1 mt-1">
                  {isOccupied ? (
                    <span className="block text-[11px] font-bold text-slate-900 truncate max-w-full">
                      {seat.currentStudentName || 'Occupant'}
                    </span>
                  ) : (
                    <span className="block text-[10px] text-slate-500 truncate">
                      {seat.floor.split(' ')[0]}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Seat Details / Action Modal */}
      {selectedSeat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-scale-in">
            {/* Header */}
            <div
              className={`p-5 text-white flex items-center justify-between ${
                selectedSeat.status === 'occupied'
                  ? 'bg-rose-700'
                  : selectedSeat.status === 'reserved'
                  ? 'bg-amber-600'
                  : 'bg-emerald-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold">
                  <Armchair className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-lg">Desk {selectedSeat.seatNumber}</h3>
                  <p className="text-xs text-white/80">
                    {selectedSeat.floor} • {selectedSeat.section}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSeat(null)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-black/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* If Occupied */}
              {selectedSeat.status === 'occupied' && occupant ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <img
                      src={occupant.photoUrl}
                      alt={occupant.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-rose-500 shadow-xs"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Current Occupant</span>
                      <h4 className="font-extrabold text-sm text-slate-900 truncate">{occupant.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">ID: {occupant.studentId}</p>
                      <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" /> +91 {occupant.mobile}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-500 block">Plan:</span>
                      <span className="font-bold text-slate-900">{occupant.planName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Expiry Date:</span>
                      <span className="font-bold text-indigo-700">
                        {new Date(occupant.expiryDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Shift:</span>
                      <span className="font-semibold text-slate-800 capitalize">
                        {occupant.shift.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Due Fees:</span>
                      <span className="font-bold text-rose-600">
                        {settings.currencySymbol || '₹'}
                        {occupant.dueAmount}
                      </span>
                    </div>
                  </div>

                  {/* Quick actions for student */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        onOpenStudentIdCard(occupant);
                        setSelectedSeat(null);
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View ID Card
                    </button>
                    <button
                      onClick={() => {
                        onOpenCollectFee(occupant);
                        setSelectedSeat(null);
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Collect Fee
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <button
                      onClick={() => handleVacate(selectedSeat.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <UserX className="w-4 h-4" />
                      Vacate Desk (सीट खाली करें)
                    </button>
                  </div>
                </div>
              ) : selectedSeat.status === 'available' ? (
                /* If Available */
                <div className="space-y-4">
                  <p className="text-xs text-slate-600">
                    This desk is currently unoccupied and ready for allocation. You can admit a new student to this seat or allocate an existing registered student.
                  </p>

                  {!isAllotting ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          onOpenAdmissionWithSeat(selectedSeat.id);
                          setSelectedSeat(null);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" />
                        Admit New Student on Desk {selectedSeat.seatNumber}
                      </button>

                      {unallottedStudents.length > 0 && (
                        <button
                          onClick={() => setIsAllotting(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition cursor-pointer"
                        >
                          <Armchair className="w-4 h-4" />
                          Assign Existing Student ({unallottedStudents.length} waiting)
                        </button>
                      )}

                      <button
                        onClick={async () => {
                          await setSeatStatus(selectedSeat.id, 'reserved');
                          addToast({ type: 'info', title: 'Seat Reserved', message: `Marked Seat ${selectedSeat.seatNumber} on hold.` });
                          setSelectedSeat(null);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                      >
                        Mark on Hold / Reserved
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-700">
                        Select Registered Student:
                      </label>
                      <select
                        value={allotStudentId}
                        onChange={(e) => setAllotStudentId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Choose Student --</option>
                        {unallottedStudents.map((stu) => (
                          <option key={stu.id} value={stu.id}>
                            {stu.name} ({stu.studentId}) — Plan: {stu.planName}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsAllotting(false)}
                          className="flex-1 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmAllot}
                          disabled={!allotStudentId}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Confirm Allotment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Reserved */
                <div className="space-y-4">
                  <p className="text-xs text-slate-600">
                    This desk is marked as Reserved / Hold.
                  </p>
                  <button
                    onClick={async () => {
                      await setSeatStatus(selectedSeat.id, 'available');
                      addToast({ type: 'success', title: 'Seat Released', message: `Seat ${selectedSeat.seatNumber} is now available.` });
                      setSelectedSeat(null);
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer transition"
                  >
                    Release & Mark as Available
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add New Desk Modal */}
      {isAddSeatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-scale-in">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h4 className="font-extrabold text-sm">Add New Study Desk</h4>
              <button onClick={() => setIsAddSeatOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSeat} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Seat Number / Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S-31"
                  value={newSeatNumber}
                  onChange={(e) => setNewSeatNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Floor</label>
                <select
                  value={newFloor}
                  onChange={(e) => setNewFloor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                >
                  <option value="Ground Floor">Ground Floor</option>
                  <option value="1st Floor">1st Floor</option>
                  <option value="2nd Floor">2nd Floor</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Section / Hall</label>
                <input
                  type="text"
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSeatOpen(false)}
                  className="px-3 py-2 border border-slate-300 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Add Desk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
