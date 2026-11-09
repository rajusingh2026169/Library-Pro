import React, { useState, useMemo } from 'react';
import {
  BookmarkCheck,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  BookOpen,
  User,
  PlusCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Reservation } from '../../types';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface ReservationsListProps {
  onOpenNewReservation: () => void;
  onFulfillToIssue: (bookId: string, memberId: string) => void;
}

export const ReservationsList: React.FC<ReservationsListProps> = ({
  onOpenNewReservation,
  onFulfillToIssue,
}) => {
  const { reservations, updateReservationStatus, cancelReservation } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [reservationToCancel, setReservationToCancel] = useState<Reservation | null>(null);

  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        r.bookTitle.toLowerCase().includes(q) ||
        r.memberName.toLowerCase().includes(q) ||
        r.memberCode.toLowerCase().includes(q);

      let matchStatus = true;
      if (statusFilter === 'active') {
        matchStatus = r.status === 'pending' || r.status === 'ready_for_pickup';
      } else if (statusFilter !== 'all') {
        matchStatus = r.status === statusFilter;
      }

      return matchSearch && matchStatus;
    });
  }, [reservations, search, statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Book Holds & Waitlist Reservations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage patrons in line for borrowed titles, hold pickup staging, and queue dispatch.
          </p>
        </div>

        <button
          onClick={onOpenNewReservation}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-xs cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4" />
          Place New Hold
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hold queue by book title, member name, or code..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 text-xs sm:text-sm rounded-xl border border-slate-200 focus:bg-white focus:border-indigo-400 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 text-xs text-slate-700 rounded-xl border border-slate-200 focus:bg-white font-medium cursor-pointer"
          >
            <option value="active">Active Holds (Pending & Ready)</option>
            <option value="ready_for_pickup">Ready for Pickup</option>
            <option value="pending">Waiting in Queue</option>
            <option value="fulfilled">Fulfilled Checkouts</option>
            <option value="cancelled">Cancelled Holds</option>
            <option value="all">All Reservation History</option>
          </select>
        </div>
      </div>

      {/* Reservations Table */}
      {filteredReservations.length === 0 ? (
        <EmptyState
          icon={BookmarkCheck}
          title="No reservations found"
          description="There are currently no hold queue requests that match the selected filter."
          actionLabel="Place Book Hold"
          onAction={onOpenNewReservation}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Patron</th>
                  <th className="py-3 px-4">Queue Position</th>
                  <th className="py-3 px-4">Date Reserved</th>
                  <th className="py-3 px-4">Status & Pickup Window</th>
                  <th className="py-3 px-4 text-right">Queue Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReservations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate">
                      {r.bookTitle}
                      <span className="block text-[10px] text-slate-400 font-mono font-normal">
                        ISBN: {r.bookIsbn}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800">{r.memberName}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">{r.memberCode}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 font-mono">
                        #{r.queuePosition}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span>{new Date(r.reservedAt).toLocaleDateString()}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col items-start gap-1">
                        <Badge
                          variant={
                            r.status === 'ready_for_pickup'
                              ? 'emerald'
                              : r.status === 'pending'
                              ? 'amber'
                              : r.status === 'fulfilled'
                              ? 'blue'
                              : 'slate'
                          }
                        >
                          {r.status.replace(/_/g, ' ')}
                        </Badge>
                        {r.readyUntil && (
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            Hold until {new Date(r.readyUntil).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {r.status === 'pending' || r.status === 'ready_for_pickup' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Fulfill to Issue */}
                          <button
                            onClick={() => onFulfillToIssue(r.bookId, r.memberId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition border border-emerald-200 cursor-pointer"
                            title="Check out book directly to this patron"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            Issue to Patron
                          </button>

                          {/* Cancel */}
                          <button
                            onClick={() => setReservationToCancel(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer"
                            title="Cancel hold"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 capitalize">{r.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cancel Reservation Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(reservationToCancel)}
        onClose={() => setReservationToCancel(null)}
        onConfirm={() => {
          if (reservationToCancel) cancelReservation(reservationToCancel.id);
        }}
        title="Cancel Hold Reservation"
        message={`Are you sure you want to cancel the hold on "${reservationToCancel?.bookTitle}" for ${reservationToCancel?.memberName}?`}
        confirmLabel="Cancel Hold"
        variant="danger"
      />
    </div>
  );
};
